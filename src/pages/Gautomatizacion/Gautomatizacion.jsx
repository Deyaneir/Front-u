import { useEffect, useState } from "react";
import {
    obtenerAutomatizaciones,
    crearAutomatizacion
} from "../../Services/adminService";

export default function Gautomatizacion() {
    const [automatizaciones, setAutomatizaciones] = useState([]);

    useEffect(() => {
        cargar();
    }, []);

    const cargar = async () => {
        const { data } = await obtenerAutomatizaciones();
        setAutomatizaciones(data);
    };

    return (
        <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">
            Automatización de Grupos
        </h1>

        <table className="w-full border">
            <thead>
            <tr>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Grupo</th>
                <th>Estado</th>
            </tr>
            </thead>
            <tbody>
            {automatizaciones.map((a) => (
                <tr key={a._id}>
                <td>{a.nombre}</td>
                <td>{a.tipo}</td>
                <td>{a.grupo?.nombre}</td>
                <td>{a.activo ? "Activo" : "Inactivo"}</td>
                </tr>
            ))}
            </tbody>
        </table>
        </div>
    );
}
