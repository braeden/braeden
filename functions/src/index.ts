import * as functions from 'firebase-functions';
import admin = require('firebase-admin');
admin.initializeApp();
const fetch = require('node-fetch')
const util = require('util');
const streamPipeline = util.promisify(require('stream').pipeline);

export const randomEmoji = functions.https.onRequest(async (req, res) => {
    res.set('Cache-Control', 'max-age=0, no-cache, no-store, must-revalidate');
    const s = admin.storage()
    s.bucket('gs://gh-img.appspot.com').getFiles(
        {
            autoPaginate: false,
            prefix: 'emojis/'
        },
        (err, files) => {
            if (!err && files) {
                const images = files.filter(file => file.name.includes('.svg'))
                const target = images[Math.floor(Math.random() * images.length)];
                if (target) {
                    res.setHeader('content-type', target?.metadata?.contentType || '')
                    target.createReadStream().pipe(res);
                    console.log('Served:', target.name);
                    return;
                }
            }
        }
    )
    res.status(404).end();
});


export const setImage = functions.https.onRequest(async (req, res) => {
    if (req.method !== 'POST' || !req?.body?.url) {
        res.status(405).end();
        return;
    }
    const db = admin.database();
    const id = [...Array(5)].map(() => Math.random().toString(36)[2]).join('')

    await db.ref(`${id}`).set({
        url: req?.body?.url || '',
        count: 0
    })

    res.status(200).json({
        id
    });
});


export const getImage = functions.https.onRequest(async (req, res) => {
    res.set('Cache-Control', 'max-age=0, no-cache, no-store, must-revalidate');
    if (req.method !== 'GET' || !req?.query?.id) {
        res.status(405).end();
        return;
    }
    const db = admin.database();

    const d = await db.ref(`/${req.query.id}`).once('value');
    const url = d?.val()?.url || '';

    const response = await fetch(url);
    if (response.ok) {
        await db.ref(`/${req.query.id}/count`).transaction(c => c + 1)
        return streamPipeline(response.body, res);
    }
    console.error(`Unexpected response ${response.statusText}`);

    res.status(500).json({
        error: "Invalid URL"
    });
});


export const getStats = functions.https.onRequest(async (req, res) => {
    if (req.method !== 'GET' || !req?.query?.id) {
        res.status(405).end();
        return;
    }
    const db = admin.database();

    const d = await db.ref(`/${req.query.id}`).once('value');
    const count = d?.val()?.count || '';

    res.status(200).json({ count });
});