import axios from "./axios";

export const obtenerAutomatizaciones = () =>
    axios.get("/admin/automatizaciones");

export const crearAutomatizacion = (data) =>
    axios.post("/admin/automatizaciones", data);
