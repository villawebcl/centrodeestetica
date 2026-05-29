function formatDate(dateStr) {
  return new Intl.DateTimeFormat("es-CL", {
    weekday: "short",
    day: "2-digit",
    month: "short"
  }).format(new Date(`${dateStr}T12:00:00`));
}

document.querySelectorAll("[data-date-label]").forEach((node) => {
  node.textContent = formatDate(node.dataset.dateLabel);
});

const form = document.querySelector("#booking-form");
const feedback = document.querySelector("#booking-feedback");
const submitBtn = document.querySelector("#submit-btn");
const timeSlotGrid = document.querySelector("#time-slots");
const slotsMessage = document.querySelector("#slots-message");
const professionalSel = form?.querySelector("[name='professional']");

function getSelectedDate() {
  return form?.querySelector("[name='date']:checked")?.value ?? "";
}

function setSlotState(label, input, taken) {
  if (taken) {
    label.classList.add("choice-card--taken");
    input.disabled = true;
    if (input.checked) {
      input.checked = false;
      const first = timeSlotGrid.querySelector("input:not([disabled])");
      if (first) first.checked = true;
    }
  } else {
    label.classList.remove("choice-card--taken");
    input.disabled = false;
  }
}

async function checkAvailability() {
  const fecha = getSelectedDate();
  const profesional = professionalSel.value;

  if (!fecha || !profesional) {
    timeSlotGrid.querySelectorAll(".choice-card").forEach((card) => {
      card.classList.remove("choice-card--taken", "choice-card--checking");
      card.querySelector("input").disabled = false;
    });
    slotsMessage.hidden = true;
    return;
  }

  timeSlotGrid.querySelectorAll(".choice-card").forEach((card) => card.classList.add("choice-card--checking"));
  slotsMessage.hidden = true;

  try {
    const res = await fetch(
      `/api/disponibilidad?fecha=${encodeURIComponent(fecha)}&profesional=${encodeURIComponent(profesional)}`
    );
    if (!res.ok) throw new Error();
    const { booked } = await res.json();
    const bookedSet = new Set(booked ?? []);

    let allTaken = true;
    timeSlotGrid.querySelectorAll(".choice-card").forEach((card) => {
      const input = card.querySelector("input");
      card.classList.remove("choice-card--checking");
      const taken = bookedSet.has(input.value);
      setSlotState(card, input, taken);
      if (!taken) allTaken = false;
    });

    if (allTaken) {
      slotsMessage.textContent = "No hay horarios disponibles para esta fecha y profesional. Prueba otro dia.";
      slotsMessage.className = "slots-message slots-message--warn";
      slotsMessage.hidden = false;
      submitBtn.disabled = true;
    } else {
      submitBtn.disabled = false;
    }
  } catch {
    timeSlotGrid.querySelectorAll(".choice-card").forEach((card) => card.classList.remove("choice-card--checking"));
  }
}

professionalSel?.addEventListener("change", checkAvailability);
form?.querySelectorAll("[name='date']").forEach((radio) => {
  radio.addEventListener("change", checkAvailability);
});

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  submitBtn.disabled = true;
  submitBtn.textContent = "Enviando...";

  const data = new FormData(form);
  const response = await fetch("/api/reservas", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: data.get("name"),
      phone: data.get("phone"),
      service: data.get("service"),
      professional: data.get("professional"),
      date: data.get("date"),
      time: data.get("time"),
      notes: data.get("notes"),
      consent: data.get("consent") === "on"
    })
  });
  const result = await response.json();

  if (!response.ok) {
    feedback.textContent = result.error || "Hubo un error al procesar tu solicitud. Por favor intenta de nuevo.";
    feedback.className = "form-note form-note--error";
    submitBtn.disabled = false;
    submitBtn.textContent = "Solicitar reserva";
    if (response.status === 409) checkAvailability();
  } else {
    feedback.textContent = `Solicitud recibida. Te contactaremos para confirmar tu cita el ${formatDate(data.get("date"))} a las ${data.get("time")}.`;
    feedback.className = "form-note form-note--success";
    form.reset();
    submitBtn.textContent = "Solicitud enviada";
    checkAvailability();
  }
});
