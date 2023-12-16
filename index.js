const puppeteer = require("puppeteer");
const fs = require("fs");

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    defaultViewport: null,
  });
  const page = await browser.newPage();
  await page.goto("https://www.nike.com/orders/gift-card-lookup");

  const search = async ({ number, pin }) => {
    const input = await page.$("#giftCardNumber");
    await input.click({ count: 2 });
    await input.type(number);
    await page.type("#giftCardPIN", pin);
    await page.click('[aria-label="Check Balance"]');
    await page.waitForSelector(
      '.text-color-success,[data-testid="invalid-card-error"]'
    );
    return await page.evaluate(
      () => document.querySelector(".text-color-success")?.textContent
    );
  };

  const path = "./cards.txt";
  const cards = fs
    .readFileSync(path, "utf8")
    .split("\r\n")
    .filter(Boolean)
    .map((item) => {
      const info = item.split(" ");
      return {
        number: info[0],
        pin: info[1],
      };
    });
  let res = "";
  await (async function get(i = 0) {
    const card = cards[i];
    if (card) {
      const row = [card.number, card.pin, await search(card)]
        .filter(Boolean)
        .join(" ");
      console.log(row);
      res += `${row}\r\n`;
      await get(++i);
    }
  })();
  fs.writeFileSync(path, res);
  await browser.close();
})();
