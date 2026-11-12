# Is it raining in Glasgow?

A live answer to Glasgow's most asked question: a giant **Yes** or **No**, plus this year's rain in numbers.

- how many days have been wet so far
- the longest dry spell and the longest wet spell
- the wettest day
- a bar for every day of the year

When it is raining, it rains on the page too.

## Try it

Open `index.html` in a browser. No build step, no dependencies, no API key.

## How it works

The weather comes from [Open-Meteo](https://open-meteo.com/), a free weather service, in two requests:

1. **Right now**, plus the last fortnight, from the forecast feed.
2. **The year so far**, from the archive feed.

The archive lags a few days behind, so the two lists are merged and the fresher one wins wherever both have a reading. The page asks the first feed what today's date is in Glasgow, so the answer is right whatever time zone the visitor's own clock is in.

The sums live in [`rain.js`](rain.js) and never touch the page or the network, which is what makes them easy to test. A day counts as wet at 1 mm of rain or more, the Met Office's definition. Snow counts as precipitation but not as rain, so a snowy day gets a "No".

If the weather service can't be reached, the page says "Probably." and admits it is guessing.

## Tests

```
node --test
```

They cover what counts as raining, merging the two lists, and the streak and total calculations, including a year with no dry days at all.

Weather data by [Open-Meteo.com](https://open-meteo.com/), licensed CC BY 4.0.
