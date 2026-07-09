
/* ============================================================
   FOREFOOT COMFORT PAD — Synapse Store
   - Bundle card selection (syncs with the form dropdown)
   - Interactive pain checklist
   - Order form -> sends to vc885222@gmail.com via FormSubmit
   - Sticky mobile order bar
   ============================================================

   ⚠️ IMPORTANT (one-time setup):
   The FIRST time someone submits this form, FormSubmit will send
   a confirmation email to vc885222@gmail.com. Open that email and
   click "Activate Form" ONCE. After that, every order lands
   directly in your inbox. No other setup needed.
   ============================================================ */

(function () {
  "use strict";

  var ORDER_EMAIL = "vc885222@gmail.com";
  var FORMSUBMIT_ENDPOINT = "https://formsubmit.co/ajax/" + ORDER_EMAIL;

  /* ---------------------------------------------
     1. BUNDLE CARDS <-> FORM DROPDOWN SYNC
  --------------------------------------------- */
  var bundleButtons = document.querySelectorAll(".bundle");
  var bundleSelect = document.getElementById("bundleSelect");

  bundleButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      // Visual selection
      bundleButtons.forEach(function (b) { b.classList.remove("selected"); });
      btn.classList.add("selected");

      // Sync the form dropdown
      var value = btn.getAttribute("data-bundle");
      if (bundleSelect) bundleSelect.value = value;

      // Scroll the user to the form
      var formWrap = document.querySelector(".form-wrap");
      if (formWrap) formWrap.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  // If user changes the dropdown directly, update the cards too
  if (bundleSelect) {
    bundleSelect.addEventListener("change", function () {
      bundleButtons.forEach(function (b) {
        b.classList.toggle("selected", b.getAttribute("data-bundle") === bundleSelect.value);
      });
    });
  }

  /* ---------------------------------------------
     2. INTERACTIVE PAIN CHECKLIST
  --------------------------------------------- */
  var checklist = document.getElementById("painChecklist");
  var checklistResult = document.getElementById("checklistResult");

  if (checklist && checklistResult) {
    checklist.addEventListener("change", function () {
      var checked = checklist.querySelectorAll("input:checked").length;

      // Highlight ticked cards
      checklist.querySelectorAll(".check-item").forEach(function (item) {
        var input = item.querySelector("input");
        item.classList.toggle("ticked", input.checked);
      });

      if (checked >= 2) {
        checklistResult.textContent =
          "You ticked " + checked + " — your forefoot is screaming for help. Keep reading. 👇";
        checklistResult.classList.add("alert");
      } else if (checked === 1) {
        checklistResult.textContent = "One tick already… be honest, there's more. 😉";
        checklistResult.classList.remove("alert");
      } else {
        checklistResult.textContent =
          "If you ticked even 2 of these — your forefoot is screaming for help.";
        checklistResult.classList.remove("alert");
      }
    });
  }

  /* ---------------------------------------------
     3. ORDER FORM SUBMISSION -> EMAIL
  --------------------------------------------- */
  var form = document.getElementById("orderForm");
  var submitBtn = document.getElementById("submitBtn");
  var formMessage = document.getElementById("formMessage");

  function showMessage(type, text) {
    formMessage.className = "form-message " + type;
    formMessage.textContent = text;
  }

  function clearErrors() {
    form.querySelectorAll(".error").forEach(function (el) {
      el.classList.remove("error");
    });
  }

  function validateForm() {
    clearErrors();
    var valid = true;
    var requiredFields = form.querySelectorAll("[required]");

    requiredFields.forEach(function (field) {
      if (!field.value || !field.value.trim()) {
        field.classList.add("error");
        valid = false;
      }
    });

    // Basic phone check (Nigerian numbers: at least 10 digits)
    var phone = document.getElementById("phone");
    if (phone && phone.value.replace(/\D/g, "").length < 10) {
      phone.classList.add("error");
      valid = false;
    }

    // Basic email check
    var email = document.getElementById("email");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
      email.classList.add("error");
      valid = false;
    }

    return valid;
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      if (!validateForm()) {
        showMessage("error", "⚠️ Please fill in all required fields correctly (check the red boxes).");
        return;
      }

      // Build payload
      var payload = {
        "Full Name": document.getElementById("fullName").value.trim(),
        "Phone Number": document.getElementById("phone").value.trim(),
        "Alternate Phone Number": (document.getElementById("altPhone").value || "None provided").trim(),
        "Email": document.getElementById("email").value.trim(),
        "Delivery Address": document.getElementById("address").value.trim(),
        "State": document.getElementById("state").value,
        "Selected Bundle": document.getElementById("bundleSelect").value,
        "_subject": "🛒 NEW ORDER — Forefoot Comfort Pad (" + document.getElementById("bundleSelect").value + ")",
        "_template": "table",
        "_captcha": "false"
      };

      // Loading state
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending your order…";
      formMessage.className = "form-message";

      fetch(FORMSUBMIT_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload)
      })
        .then(function (response) {
          if (!response.ok) throw new Error("Network error");
          return response.json();
        })
        .then(function () {
          showMessage(
            "success",
            "✅ Order received! We'll call you shortly to confirm your delivery. Thank you!"
          );
          form.reset();
          // Restore default bundle selection after reset
          bundleSelect.value = "Buy 2 pairs — ₦19,500 (Save ₦14,500)";
          bundleButtons.forEach(function (b) {
            b.classList.toggle(
              "selected",
              b.getAttribute("data-bundle") === bundleSelect.value
            );
          });
          
          // Redirect to thank you page after 2 seconds
          setTimeout(function () {
            window.location.href = window.location.origin + "/Thankyou/";
          }, 2000);
        })
        .catch(function () {
          showMessage(
            "error",
            "❌ Something went wrong sending your order. Please check your internet connection and try again, or contact us on WhatsApp."
          );
        })
        .finally(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = "✅ Place My Order — Pay On Delivery";
        });
    });
  }

  /* ---------------------------------------------
     4. STICKY MOBILE ORDER BAR
     (shows after scrolling past the hero, hides at the form)
  --------------------------------------------- */
  var stickyBar = document.getElementById("stickyBar");
  var hero = document.querySelector(".hero");
  var orderSection = document.getElementById("order");

  function toggleStickyBar() {
    if (!stickyBar || !hero || !orderSection) return;
    var pastHero = window.scrollY > hero.offsetTop + hero.offsetHeight;
    var atForm =
      window.scrollY + window.innerHeight > orderSection.offsetTop + 200;
    stickyBar.classList.toggle("visible", pastHero && !atForm);
  }

  window.addEventListener("scroll", toggleStickyBar, { passive: true });
  toggleStickyBar();
})();
