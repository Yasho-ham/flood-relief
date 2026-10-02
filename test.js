
  /* =====================================================
     COPY
     ===================================================== */

  function showToast(message) {

    const toast =
      document.getElementById("toast");

    toast.innerText = message;

    toast.style.display = "block";

    clearTimeout(window.toastTimer);

    window.toastTimer =
      setTimeout(function () {

        toast.style.display = "none";

      }, 1800);

  }



  async function copyValue(value) {

    try {

      await navigator.clipboard.writeText(value);

      showToast("Copied!");

    }

    catch (error) {

      showToast("Copy failed");

    }

  }



  function copyText(id) {

    const value =
      document
      .getElementById(id)
      .innerText
      .trim();

    copyValue(value);

  }



  /* =====================================================
     COPY BENEFICIARY
     ===================================================== */

  function copyBeneficiary(number) {

    const name =
      document
      .getElementById("name" + number)
      .innerText
      .trim();

    const bank =
      document
      .getElementById("bank" + number)
      .innerText
      .trim();

    const account =
      document
      .getElementById("account" + number)
      .innerText
      .trim();

    const ifsc =
      document
      .getElementById("ifsc" + number)
      .innerText
      .trim();

    const branch =
      document
      .getElementById("branch" + number)
      .innerText
      .trim();


    const text =

`Account Holder: ${name}
Bank: ${bank}
Account Number: ${account}
IFSC: ${ifsc}
Branch: ${branch}`;


    copyValue(text);

  }



  /* =====================================================
     THREE UPI QRS
     ===================================================== */

  function createUpiQr(
    qrElementId,
    upiElementId
  ) {

    const upiId =
      document
      .getElementById(upiElementId)
      .innerText
      .trim();


    const qrElement =
      document.getElementById(qrElementId);


    /*
      Leave a slot blank when it still contains a placeholder.
    */

    if (
      !upiId ||
      upiId.startsWith("YOUR_UPI_ID")
    ) {

      qrElement.innerHTML =
        '<div style="color:#94a3b8;font-size:12px;">Add UPI ID</div>';

      return;
    }


    const upiUri =

      "upi://pay" +

      "?pa=" +
      encodeURIComponent(upiId) +

      "&pn=" +
      encodeURIComponent("Flood Relief Support") +

      "&cu=INR";


    new QRCode(

      qrElement,

      {
        text: upiUri,

        width: 175,

        height: 175,

        correctLevel:
          QRCode.CorrectLevel.M
      }

    );

  }


  /* =====================================================
     DOWNLOAD UPI QR
     ===================================================== */

  function downloadUpiQr(number) {

    const qrElement =
      document.getElementById("upiQr" + number);

    const image = qrElement.querySelector("img");
    const canvas = qrElement.querySelector("canvas");

    const upiId =
      document
      .getElementById("upiId" + number)
      .innerText
      .trim();

    if (!upiId || upiId.startsWith("YOUR_UPI_ID")) {
      showToast("Add a UPI ID first");
      return;
    }

    const filename =
      "upi-qr-" + number + "-" +
      upiId.replace(/[^a-zA-Z0-9@._-]/g, "_") +
      ".png";

    const link = document.createElement("a");
    link.download = filename;

    if (canvas) {
      link.href = canvas.toDataURL("image/png");
      link.click();
      return;
    }

    if (image) {
      fetch(image.src)
        .then(response => response.blob())
        .then(blob => {
          link.href = URL.createObjectURL(blob);
          link.click();
          setTimeout(() => URL.revokeObjectURL(link.href), 1000);
        })
        .catch(() => {
          /* Fallback: open the QR image if download is blocked. */
          window.open(image.src, "_blank", "noopener,noreferrer");
        });
      return;
    }

    showToast("QR is not ready yet");
  }


  /* =====================================================
     COMMUNITY — SUPABASE
     ===================================================== */

  const COMMUNITY_SUPABASE_URL = "https://sgxmfyqwcwosrdwqhyfv.supabase.co";
  const COMMUNITY_SUPABASE_KEY = "sb_publishable_vNOWN1fI9FkL4avB86kK8g_4f1YupFi";
  const communityClient = window.supabase.createClient(
    COMMUNITY_SUPABASE_URL,
    COMMUNITY_SUPABASE_KEY
  );
  let approvedEndorsements = [];
  let endorsementOffset = 0;
  let endorsementTimer;

  function escapeCommunityText(value) {
    return String(value || "").replace(/[&<>'"]/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    })[char]);
  }

  function displayEndorsements() {
    const list = document.getElementById("endorsementList");
    if (!approvedEndorsements.length) {
      list.innerHTML = '<div class="comments-fallback">Be the first to endorse this appeal.</div>';
      return;
    }

    const visible = Array.from({ length: Math.min(1, approvedEndorsements.length) }, (_, index) =>
      approvedEndorsements[(endorsementOffset + index) % approvedEndorsements.length]
    );
    list.innerHTML = visible.map(item => `
      <article class="endorsement-item">
        <div class="endorsement-name">${escapeCommunityText(item.name)}</div>
        <div class="endorsement-role">${escapeCommunityText([item.designation, item.organisation].filter(Boolean).join(" · "))}</div>
        ${item.message ? `<p class="endorsement-message">${escapeCommunityText(item.message)}</p>` : ""}
      </article>
    `).join("");
  }

  function displayComments(comments) {
    const list = document.getElementById("commentList");
    if (!comments.length) {
      list.innerHTML = '<div class="comments-fallback">No public messages yet.</div>';
      return;
    }
    list.innerHTML = comments.map(item => `
      <article class="comment-item">
        <div class="comment-name">${escapeCommunityText(item.name || "Supporter")}</div>
        <p class="comment-message">${escapeCommunityText(item.message)}</p>
      </article>
    `).join("");
  }

  async function loadCommunity() {
    const [endorsementResult, commentResult] = await Promise.all([
      communityClient.from("endorsements").select("name, designation, organisation, message, created_at").eq("status", "approved").order("created_at", { ascending: false }),
      communityClient.from("comments").select("name, message, created_at").eq("status", "approved").order("created_at", { ascending: false }).limit(30)
    ]);

    if (endorsementResult.error || commentResult.error) {
      const message = "Community submissions will be available once the database setup is complete.";
      document.getElementById("endorsementList").innerHTML = `<div class="comments-fallback">${message}</div>`;
      document.getElementById("commentList").innerHTML = `<div class="comments-fallback">${message}</div>`;
      return;
    }

    approvedEndorsements = endorsementResult.data || [];
    endorsementOffset = 0;
    displayEndorsements();
    displayComments(commentResult.data || []);
    clearInterval(endorsementTimer);
    if (approvedEndorsements.length > 1) {
      endorsementTimer = setInterval(() => {
        endorsementOffset = (endorsementOffset + 1) % approvedEndorsements.length;
        displayEndorsements();
      }, 10000);
    }
  }

  async function submitCommunityForm(event, table, statusId) {
    event.preventDefault();
    const form = event.currentTarget;
    const status = document.getElementById(statusId);
    const values = Object.fromEntries(new FormData(form).entries());
    status.textContent = "Submitting…";
    const { error } = await communityClient.from(table).insert({ ...values, status: "pending" });
    if (error) {
      status.textContent = "Unable to submit right now. Please try again shortly.";
      return;
    }
    form.reset();
    status.textContent = "Thank you. Your submission will appear after approval.";
  }

  async function loadAdminQueue() {
    const { data: sessionData } = await communityClient.auth.getSession();
    if (!sessionData.session) return;

    const [endorsementResult, commentResult] = await Promise.all([
      communityClient.from("endorsements").select("id, name, designation, organisation, message").eq("status", "pending").order("created_at"),
      communityClient.from("comments").select("id, name, message").eq("status", "pending").order("created_at")
    ]);
    if (endorsementResult.error || commentResult.error) return;
    const items = [
      ...(endorsementResult.data || []).map(item => ({ ...item, type: "endorsements", summary: `${item.name} — ${[item.designation, item.organisation].filter(Boolean).join(", ")}` })),
      ...(commentResult.data || []).map(item => ({ ...item, type: "comments", summary: `${item.name || "Supporter"}: ${item.message}` }))
    ];
    document.getElementById("adminPanel").classList.add("open");
    document.getElementById("adminList").innerHTML = items.length ? items.map(item => `
      <article class="admin-item">
        <div class="comment-message">${escapeCommunityText(item.summary)}</div>
        <div class="admin-actions">
          <button type="button" onclick="moderateCommunityItem('${item.type}', '${item.id}', 'approved')">Approve</button>
          <button type="button" class="secondary" onclick="moderateCommunityItem('${item.type}', '${item.id}', 'rejected')">Hide</button>
        </div>
      </article>
    `).join("") : '<div class="comments-fallback">No submissions are awaiting review, or this account does not have moderation access.</div>';
  }

  async function moderateCommunityItem(table, id, status) {
    const { error } = await communityClient.from(table).update({ status }).eq("id", id);
    if (!error) {
      await Promise.all([loadCommunity(), loadAdminQueue()]);
    }
  }

  async function requestAdminAccess() {
    const email = window.prompt("Enter your approved admin email address:");
    const status = document.getElementById("adminStatus");
    if (!email) return;
    const { error } = await communityClient.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: window.location.href }
    });
    status.textContent = error ? "Unable to send the sign-in link." : "Check your inbox for the admin sign-in link.";
  }


  /* =====================================================
     PERSONAL INTRO
     ===================================================== */

  function toggleIntro() {
    const full = document.getElementById("introFull");
    const button = document.getElementById("readMoreBtn");
    const isOpen = full.classList.toggle("open");
    button.innerText = isOpen ? "Read less" : "Read more";
  }


  /* =====================================================
     INITIALISE
     ===================================================== */

  createUpiQr("upiQr1", "upiId1");

  createUpiQr("upiQr2", "upiId2");

  createUpiQr("upiQr3", "upiId3");

  document.getElementById("endorsementForm").addEventListener("submit", event =>
    submitCommunityForm(event, "endorsements", "endorsementStatus")
  );
  document.getElementById("commentForm").addEventListener("submit", event =>
    submitCommunityForm(event, "comments", "commentStatus")
  );
  document.getElementById("adminAccessButton").addEventListener("click", requestAdminAccess);
  loadCommunity();
  loadAdminQueue();

