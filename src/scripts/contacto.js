const form = document.querySelector("#contact-form");
const submitBtn = document.querySelector("#contact-submit");
const feedback = document.querySelector("#contact-feedback");

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  submitBtn.disabled = true;
  submitBtn.textContent = "Enviando...";

  const data = new FormData(form);
  try {
    const response = await fetch("/api/contacto", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: data.get("name"),
        phone: data.get("phone"),
        email: data.get("email"),
        service: data.get("service"),
        message: data.get("message"),
        consent: data.get("consent") === "on"
      })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "No se pudo enviar.");

    feedback.textContent = "Mensaje recibido. Te contactaremos pronto.";
    feedback.className = "form-note form-note--success";
    form.reset();
  } catch (error) {
    feedback.textContent = error.message;
    feedback.className = "form-note form-note--error";
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Enviar consulta";
  }
});
