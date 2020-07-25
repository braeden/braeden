import * as functions from 'firebase-functions';
import admin = require('firebase-admin');
const fetch = require('node-fetch')
const util = require('util');
const streamPipeline = util.promisify(require('stream').pipeline);
admin.initializeApp();
import { emoji } from "./emoji-list";

export const randomEmoji = functions.https.onRequest(async (req, res) => {
    res.set('Cache-Control', 'max-age=0, no-cache, no-store, must-revalidate');
    const target = emoji[Math.floor(Math.random() * emoji.length)];
    const url = `https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/${target}.svg`
    const response = await fetch(url);
    if (response.ok) {
        res.setHeader('content-type', response.headers.get('content-type') || '');
        return streamPipeline(response.body, res);
    }
    res.status(404).end()
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