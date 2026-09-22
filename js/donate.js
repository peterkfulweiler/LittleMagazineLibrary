// ===========================================================
// DONATE — donate.js
// ===========================================================
//
// SETUP: replace YOUR_BUTTON_ID below (and the three matching
// hrefs in donate.html) with your real PayPal "Donate" button ID.
//
// How to get one:
//   1. Log into paypal.com with the account you want donations to land in
//      (a personal account works fine for this).
//   2. Go to paypal.com/buttons and create a "Donate" button.
//   3. PayPal gives you a "hosted_button_id" — copy just that ID string.
//   4. Paste it in place of YOUR_BUTTON_ID in each tier link in
//      donate.html, and in the constant below.
//
// If you'd rather use Stripe Payment Links instead of PayPal, swap the
// URLs in donate.html for your Stripe links directly — Stripe Payment
// Links support a fixed amount per link, so you'd create one link per
// tier (no "&amount=" trick needed, and the custom-amount box below
// would need a Stripe link that allows a customer-entered amount,
// which Stripe also supports as an option when creating the link).

const PAYPAL_BUTTON_ID = "YOUR_BUTTON_ID";

const customForm = document.getElementById("custom-form");
const customAmountInput = document.getElementById("custom-amount");

customForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const amount = parseFloat(customAmountInput.value);
  if (!amount || amount <= 0) {
    customAmountInput.focus();
    return;
  }
  const url = `https://www.paypal.com/donate/?hosted_button_id=${PAYPAL_BUTTON_ID}&amount=${amount}`;
  window.open(url, "_blank", "noopener");
});