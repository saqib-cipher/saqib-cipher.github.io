/**
 * Cloudflare Pages Middleware for SketchX
 * Injects dynamic OpenGraph & Twitter metadata for community post links
 * by fetching the post record from Firebase Realtime Database REST API.
 */

export async function onRequest(context) {
    const { request, next } = context;
    const url = new URL(request.url);
    const postId = url.searchParams.get('id') || url.searchParams.get('postId');

    // Only process post pages with an ID
    const isPostPage = url.pathname.includes('post') || postId;
    if (!isPostPage || !postId) {
        return next();
    }

    try {
        // Query Firebase RTDB REST API
        const firebaseRestUrl = `https://sketchx-88b8e-default-rtdb.asia-southeast1.firebasedatabase.app/community_posts/${encodeURIComponent(postId)}.json`;
        const rtdbResponse = await fetch(firebaseRestUrl, {
            cf: { cacheTtl: 60, cacheEverything: true }
        });

        if (!rtdbResponse.ok) {
            return next();
        }

        const post = await rtdbResponse.json();
        if (!post || post.hidden) {
            return next();
        }

        const title = escapeHtml(post.title || 'SketchX Post');
        const author = escapeHtml(post.authorName || 'Community Member');
        const isBlock = (post.type === 'block' || post.type === 'blocks');
        const typeLabel = isBlock ? 'Custom Block' : 'Code Snippet';

        let description = (post.description || 'View custom blocks and Java logic for Sketchware Pro on SketchX.')
            .replace(/[#*_`\r\n]+/g, ' ')
            .trim();
        if (description.length > 200) {
            description = description.substring(0, 197) + '...';
        }
        description = escapeHtml(description);

        const pageTitle = `${title} by ${author} (${typeLabel}) - SketchX`;
        const postUrl = url.toString();
        const logoUrl = 'https://sketchx.pages.dev/images/logo.png';

        const userAgent = (request.headers.get('user-agent') || '').toLowerCase();
        const isBot = /bot|crawl|spider|slurp|facebook|whatsapp|telegram|twitter|tweet|discord|slack|skype|preview|embedly|quora|outbrain|pinterest|apple|google/i.test(userAgent);

        if (isBot) {
            // Return ultra-clean OpenGraph HTML document for social crawler bots
            const botHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${pageTitle}</title>
    <meta name="description" content="${description}">

    <!-- OpenGraph Metadata -->
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="SketchX">
    <meta property="og:title" content="${pageTitle}">
    <meta property="og:description" content="${description}">
    <meta property="og:url" content="${postUrl}">
    <meta property="og:image" content="${logoUrl}">
    <meta property="og:image:width" content="512">
    <meta property="og:image:height" content="512">

    <!-- Twitter Cards -->
    <meta name="twitter:card" content="summary">
    <meta name="twitter:site" content="@SketchX">
    <meta name="twitter:title" content="${pageTitle}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${logoUrl}">
    <meta name="theme-color" content="#7C4DFF">

    <link rel="canonical" href="${postUrl}">
</head>
<body>
    <h1>${pageTitle}</h1>
    <p>${description}</p>
    <a href="${postUrl}">View on SketchX</a>
</body>
</html>`;

            return new Response(botHtml, {
                headers: {
                    'Content-Type': 'text/html; charset=UTF-8',
                    'Cache-Control': 'public, max-age=120, s-maxage=300'
                }
            });
        }

        // For browsers: get normal response and rewrite the meta tags on the fly
        const response = await next();
        return new HTMLRewriter()
            .on('title', {
                element(e) { e.setInnerContent(pageTitle); }
            })
            .on('meta[name="description"]', {
                element(e) { e.setAttribute('content', description); }
            })
            .on('meta[property="og:title"]', {
                element(e) { e.setAttribute('content', pageTitle); }
            })
            .on('meta[property="og:description"]', {
                element(e) { e.setAttribute('content', description); }
            })
            .on('meta[name="twitter:title"]', {
                element(e) { e.setAttribute('content', pageTitle); }
            })
            .on('meta[name="twitter:description"]', {
                element(e) { e.setAttribute('content', description); }
            })
            .transform(response);

    } catch (err) {
        return next();
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
