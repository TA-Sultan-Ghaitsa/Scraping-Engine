# Instagram Scraper API Using Playwright
- [Introduction](#Introduction)
- [Install](#Install)
- [Tutorial](#tutorial)
## Introduction
This scraper program was created as a task submitted to Mr. Okky Ibrohim. Me and Ghaitsa have created a scraper using Playwright, node.js, and Express.js. This Scraper is able to be used as an API endpoint. The API format would be localhost:3010/api/scraper/{username}, this could be deployed into a server also given the resource. The {username} can be changed into any other public instagram username that you wish to be scraped. 

NOTE: You will need to provide your own dummy instagram account to do this
## Install
Make sure you have node.js installed using ```node -v```. If haven't follow [here](https://nodejs.org/en/download).
```
mkdir scraper
```
```
cd scraper
```
```
git clone https://github.com/TA-Sultan-Ghaitsa/Scraping-Engine.git
```
```
cd scraping
```
```
npm i
```
## Tutorial
Run the program using
```
node server.js
```
You will need Postman for the next steps. First, you will need to set up some headers on the postman.<br>
Keys | Value
-- | --
user | _the username of the dummy account used for scraping. i.e: user_ 
password | _the password of the dummy acoount. i.e: password_
target_post | _the number of post(s) will be scraped (descending). i.e: 10_
target_comment | _the number of comment(s) will be scraped per post(descending). i.e: 50_

Next, using Postman hit the API: localhost:3010/api/scraper/{username} (replace username with whatever public instagram username you would want to use). 
