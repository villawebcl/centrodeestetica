const STORAGE_KEY = "lumina:appointments";

export const appointmentStore = {
  all() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  },

  save(appointments) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
  },

  create(payload) {
    const appointments = this.all();
    const appointment = {
      id: crypto.randomUUID(),
      status: "pendiente",
      createdAt: new Date().toISOString(),
      ...payload
    };

    this.save([appointment, ...appointments]);
    return appointment;
  },

  updateStatus(id, status) {
    const appointments = this.all().map((appointment) =>
      appointment.id === id ? { ...appointment, status } : appointment
    );
    this.save(appointments);
  },

  remove(id) {
    this.save(this.all().filter((appointment) => appointment.id !== id));
  }
};

export const statusLabels = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  completada: "Completada",
  cancelada: "Cancelada"
};

export function formatDate(date) {
  return new Intl.DateTimeFormat("es-CL", {
    weekday: "short",
    day: "2-digit",
    month: "short"
  }).format(new Date(`${date}T12:00:00`));
}

export function formatCreatedAt(value) {
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
