let firstName;
let emailAddress;
let lastName;

let fullPhoneNumber;
let iti;
let otpTiming = "";
let endTime = new Date();
let timerInterval = null;
document.addEventListener("DOMContentLoaded", function () {
  const phoneInput = document.querySelector("#phone-number");

  iti = intlTelInput(phoneInput, {
    initialCountry: "kw",
    separateDialCode: true,
    preferredCountries: ["eu", "kw", "om", "qa", "sa", "ae", "gb"],
    utilsScript:
      "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/utils.js",
  });
});

function setEndTiming() {
  const now = new Date();
  const thirtySecondsLater = new Date();
  thirtySecondsLater.setSeconds(now.getSeconds() + 15); // Add 30 seconds to the current time
  endTime = thirtySecondsLater;
  localStorage.setItem("otp-time", now.toISOString()); // Store the current time in ISO format
  updateElapsedTime();
}

function updateElapsedTime() {
  const dis = document.getElementById("resend-otp-button");

  const now = new Date();
  const elapsedMs = endTime - now;
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const otp = document.getElementById("otp-timer");
  if (totalSeconds < 0) {
    clearInterval(timerInterval);
    dis.style.display = "block";
    otp.style.display = "none";
  } else {
    timerInterval = setInterval(updateElapsedTime, 1000);
    dis.style;
    otp.style.display = "block";
  }
  otp.textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

if (localStorage.getItem("otp-time")) {
  const existingTime = new Date(localStorage.getItem("otp-time"));
  existingTime.setMinutes(existingTime.getMinutes() + 10);
  endTime = existingTime;
  updateElapsedTime();
}

async function checkCustomerExists(event) {
  event.preventDefault();

  if (iti && iti.isValidNumber()) {
    fullPhoneNumber = iti.getNumber().replace("+", "");

    const otpStatus = document.getElementById("otp-status");
    const numberStatus = document.getElementById("whatsapp-number");
    const loader = document.getElementById("loader");
    const loaderText = document.getElementById("loader-text");
    loader.style.display = "inline-block";
    loaderText.style.display = "none";
    document.getElementById("login_btn").disabled = true;

    try {
      const response = await fetch("https://api-url/dev/wati/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          whatsappNumber: fullPhoneNumber,
          type: "check_customer",
        }),
      });

      const data = await response.json();

      if (
        data?.["statusCode"] == 200 &&
        data?.["body"] == "Customer check completed, ready to create customer"
      ) {
        loader.style.display = "none";
        loaderText.style.display = "block";
        document.getElementById("login_btn").disabled = false;
        otpStatus.style.paddingTop = "10px";
        otpStatus.textContent = "No account found";
        otpStatus.style.color = "black";
        otpStatus.style.display = "block";
        document.getElementById("login_btn").style.display = "none";
        document.getElementById("retry").style.display = "block";
        document.getElementById("close").style.display = "block";
        document.getElementById("create_account").style.display = "block";
        document.getElementById("whatsapp-number").value = fullPhoneNumber;
      } else if (
        data?.["statusCode"] == 200 &&
        data?.["body"] == "Customer already exists"
      ) {
        document.getElementById("otp-login-form").style.display = "none";
        loginVerify(event);
      } else {
        document.getElementById("create_account").style.display = "none";
        document.getElementById("retry").style.display = "none";
        document.getElementById("close").style.display = "none";
        setTimeout(() => {
          window.location.href = `https://admin.shopify.com/store/atyalalmarshoudteststore/customers`;
        }, 1000);
      }
    } catch (error) {
      otpStatus.textContent =
        "Network error. Please check your connection and try again.";
      otpStatus.style.color = "red";
    }
  } else {
    alert(
      "Invalid phone number. Please enter a valid phone number with the correct country code."
    );
  }
}

async function verifyOtp(event) {
  event.preventDefault();
  const otp = document.getElementById("otp").value;
  const otpStatusVerify = document.getElementById("otp-status-verify");

  const loader = document.getElementById("verifyLoader");
  const loaderText = document.getElementById("verifyLoaderText");
  loader.style.display = "inline-block";
  loaderText.style.display = "none";
  document.getElementById("verifyBtn").disabled = true;

  firstName = document.getElementById("first-name").value;
  lastName = document.getElementById("last-name").value;
  emailAddress = document.getElementById("email-address").value;

  document.getElementById("resend-otp-button").style.display = "none";

  try {
    const response = await fetch("https://api-url/dev/wati/otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        otp: otp,
        whatsappNumber: fullPhoneNumber,
        type: "verify_otp",
        firstName: firstName,
        lastName: lastName,
        email: emailAddress,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      loader.style.display = "none";
      loaderText.style.display = "block";
      document.getElementById("verifyBtn").disabled = false;
      if (
        data?.["statusCode"] == 200 &&
        data?.["body"]?.["verifyresponse"]?.["message"]?.otp &&
        data?.["body"]?.["verifyresponse"]?.["customer"]?.data?.customerCreate
          ?.customer?.id
      ) {
        const customerId = data?.["body"]?.["id"] ?? "";
        const id = customerId?.split("/").pop();
        window.location.href = `https://admin.shopify.com/store/atyalalmarshoudteststore/customers/${id}`;
      } else if (
        data?.["body"]?.["verifyresponse"]?.["message"]?.otp &&
        data?.["body"]?.["verifyresponse"]?.["res"] == "customer already exists"
      ) {
        window.location.href = `https://admin.shopify.com/store/atyalalmarshoudteststore/customers`;
      } else {
        otpStatusVerify.style.paddingTop = "15px";
        otpStatusVerify.textContent = "Invalid OTP. Please try again.";
        otpStatusVerify.style.color = "red";
      }
    } else {
      otpStatusVerify.textContent =
        "Invalid OTP. Please enter the correct OTP and try again.";
      otpStatusVerify.style.color = "red";
    }
  } catch (error) {
    otpStatusVerify.textContent =
      "An error occurred during verification. Please try again.";
    otpStatusVerify.style.color = "red";
  }
}

async function createAccount(event) {
  console.log("createAccount");
  event.preventDefault();
  const accountStatus = document.getElementById("create-account-status");
  const loader = document.getElementById("createLoader");
  const loaderText = document.getElementById("createLoader-text");
  loader.style.display = "inline-block";
  loaderText.style.display = "none";
  document.getElementById("create_btn").disabled = true;

  try {
    const response = await fetch("https://api-url/dev/wati/otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        whatsappNumber: fullPhoneNumber,
        type: "send_otp",
        template_name: "wati_otp_template",
        broadcast_name: "string",
        resend_otp: false,
      }),
    });

    const data = await response.json();
    if (response.ok) {
      loader.style.display = "none";
      loaderText.style.display = "block";
      document.getElementById("create_btn").disabled = false;
      console.log("abcd");
      if (data.body === "Customer already exists") {
        console.log("already exists");
        accountStatus.style.paddingTop = "15px";
        accountStatus.textContent =
          "Customer already exists. Redirecting to login...";
        accountStatus.style.color = "orange";
        window.location.href = `https://admin.shopify.com/store/atyalalmarshoudteststore/customers`;
      } else {
        accountStatus.style.display = "block";
        setEndTiming();
        document.getElementById("create-account-form").style.display = "none";
        document.getElementById("otp-verify-form").style.display = "block";

        const phoneNumberSpan = document.getElementById("phoneNumberSpan");

        if (fullPhoneNumber.length > 4) {
          const maskedPhoneNumber = fullPhoneNumber.replace(
            /^(\d{1,4})(\d+)(\d{4})$/,
            (_, countryCode, middle, lastFour) => {
              return `+${countryCode}${"*".repeat(middle.length)}${lastFour}`;
            }
          );

          phoneNumberSpan.textContent = maskedPhoneNumber;
        }

        console.log(fullPhoneNumber, "fullPhoneNumber phoneNumberSpan");
      }
    } else {
      accountStatus.textContent = "Account creation failed. Please try again.";
      accountStatus.style.color = "red";
    }
  } catch (error) {
    accountStatus.textContent =
      "Network error. Please check your connection and try again.";
    accountStatus.style.color = "red";
  }
}

async function ResendOTP(event) {
  event.preventDefault();
  const resend_otp_btn = document.getElementById("resend-otp-button");
  const accountStatus = document.getElementById("otp-status-verify");
  resend_otp_btn.style.display = "block";

  const phoneNumberSpan = document.getElementById("phoneNumberSpan");

  if (fullPhoneNumber.length > 4) {
    const maskedPhoneNumber = fullPhoneNumber.replace(
      /^(\d{1,4})(\d+)(\d{4})$/,
      (_, countryCode, middle, lastFour) => {
        return `+${countryCode}${"*".repeat(middle.length)}${lastFour}`;
      }
    );

    phoneNumberSpan.textContent = maskedPhoneNumber;
  }

  console.log(fullPhoneNumber, "fullPhoneNumber phoneNumberSpan");

  try {
    const response = await fetch("https://api-url/dev/wati/otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        whatsappNumber: fullPhoneNumber,
        type: "send_otp",
        template_name: "wati_otp_template",
        broadcast_name: "string",
        resend_otp: true,
      }),
    });

    const data = await response.json();
    if (response.ok) {
      if (data.body === "Customer already exists") {
        accountStatus.style.paddingTop = "15px";
        accountStatus.textContent =
          "Customer already exists. Redirecting to login...";
        accountStatus.style.color = "orange";
        window.location.href = `https://admin.shopify.com/store/atyalalmarshoudteststore/customers`;
      } else if (data?.["body"]?.["message"]) {
        accountStatus.style.paddingTop = "15px";
        accountStatus.textContent =
          "Resend OTP hourly limit reached. Try after some times";
        accountStatus.style.color = "red";
        const resend_otp_btn = document.getElementById("resend-otp-button");
        resend_otp_btn.style.display = "none";
      } else {
        accountStatus.style.paddingTop = "15px";
        resend_otp_btn.style.display = "none";
        setEndTiming();
        document.getElementById("create-account-form").style.display = "none";
        document.getElementById("otp-verify-form").style.display = "block";
      }
    } else {
      accountStatus.textContent = "Invalid OTP. Please try again.";
      accountStatus.style.color = "red";
    }
  } catch (error) {
    accountStatus.textContent =
      "Network error. Please check your connection and try again.";
    accountStatus.style.color = "red";
  }
}

function handleButtonClick() {
  document.getElementById("otp-login-form").style.display = "none";
  const create_account_form = document.getElementById("create-account-form");
  create_account_form.style.display = "block";
}

function handleClear() {
  const inputValue = document.getElementById("phone-number");
  inputValue.value = "";
  alertMessageDisable();
}

function alertMessageDisable() {
  document.getElementById("otp-status").style.display = "none";
}

function otpValidation() {
  const otpInput = document.getElementById("otp").value;
  const verifyBtn = document.getElementById("verifyBtn");

  if (otpInput.length === 6) {
    verifyBtn.disabled = false;
  } else {
    verifyBtn.disabled = true;
  }
}

function loginVerify(event) {
  document.getElementById("otp-verify-form").style.display = "block";
  ResendOTP(event);
}
