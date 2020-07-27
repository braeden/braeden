addEventListener('fetch', event => {
    const { request } = event
    if (request.method === 'POST') {
        return event.respondWith(postResponse(request))
    } else if (request.method === 'GET') {
        return event.respondWith(getImage(request))
    }
});

async function postResponse(request) {
    const body = await request.json()
    if (body.url) {
        // setImage
        const id = [...Array(5)].map(() => Math.random().toString(36)[2]).join('')
        await GH.put(id, JSON.stringify({
            url: body.url || '',
            count: 0
        }));
        return new Response(JSON.stringify({
            id
        }))
    } else if (body.id) {
        // getImage
        const kvObject = JSON.parse(await GH.get(body.id));
        return new Response(JSON.stringify({ count: kvObject.count }));
    }
    return new Response('Not a valid POST request')
}

async function getImage(request) {
    const params = {}
    const url = new URL(request.url)
    const queryString = url.search.slice(1).split('&')
    queryString.forEach(item => {
        const [key, value] = item.split('=');
        if (key) params[key] = value || true;
    })
    const kvEntry = await GH.get(params.id)
    if (kvEntry) {
        try {
            const kvObject = JSON.parse(kvEntry);
            const image = await fetch(kvObject.url);
            const {
                readable,
                writable
            } = new TransformStream();
            image.body.pipeTo(writable);
            const r = new Response(readable, image)
            r.headers.set('Cache-Control', 'max-age=0, no-cache, no-store, must-revalidate')
            kvObject.count++;
            await GH.put(params.id, JSON.stringify(kvObject));
            return r;
        } catch (e) {
            console.error(e);
            return new Response('URL was invalid');
        }
    }
    return new Response('ID not found');
}