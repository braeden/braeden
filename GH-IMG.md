# REST API to track view stats on Github with any image

## You can embed an image and check how many people check out your Github!

### Built with Typescript, Firebase, Postman, Express

There are 4 key RESTful endpoints (check the Postman Collection for more details):

### `setImage`
```
POST
https://us-central1-gh-img.cloudfunctions.net/setImage

Requires:
{
    "url": "any valid image URL"
}

Returns:
{
    "id": "5 digit alpha numeric string"  // (don't lose this)
}
OR 
HTTP 405
```

### `getImage` 
```
GET
https://us-central1-gh-img.cloudfunctions.net/getImage

Requires URL query: id={ID_HERE}

eg: https://us-central1-gh-img.cloudfunctions.net/getImage?id=abcd1
This is what you'll embed in your Username/README.md

Returns:
The image from the URL that was posted 
OR
HTTP 405 (if incorrect method or missing query)
OR
HTTP 500 (if there is an issue with URL)
```


### `getStats` 
```
GET
https://us-central1-gh-img.cloudfunctions.net/getStats

Requires URL query: id={ID_HERE}

eg: https://us-central1-gh-img.cloudfunctions.net/getStats?id=abcd1
This is what you'll embed in your Username/README.md

Returns:
{
    "count": 10 // The number of successful GET requests performed to getImage
}
OR
HTTP 405 (if incorrect method or missing query)
```


### `randomEmoji` 
```
GET
https://us-central1-gh-img.cloudfunctions.net/randomEmoji

Returns:
A random SVG emoji from https://github.com/twitter/twemoji

```


## Setup
```
cd functions
npm install
npm install -g firebase
firebase login
```

## Build

```
npm run serve
```

## Deploy

```
firebase deploy
```


## Details

https://rushter.com/blog/github-profile-markdown/