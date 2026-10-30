import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    if (
        err instanceof SyntaxError &&
        "status" in err &&
        err.status === 400 &&
        "body" in err
    ) {
        res.status(400).json({
            status: "error",
            error: { code: "INVALID_JSON", message: "El cuerpo de la solicitud no contiene JSON válido." },
        });
        return;
    }

    if ("status" in err && err.status === 413) {
        res.status(413).json({
            status: "error",
            error: {
                code: "PAYLOAD_TOO_LARGE",
                message: "El cuerpo de la solicitud supera el tamaño permitido.",
            },
        });
        return;
    }

    if (err instanceof mongoose.Error.CastError) {
        res.status(400).json({
            status: "error",
            error: { code: "INVALID_ID", message: "El identificador enviado no es válido." },
        });
        return;
    }
    if (err instanceof mongoose.Error.ValidationError) {
        res.status(400).json({
            status: "error",
            error: { code: "VALIDATION_ERROR", message: err.message },
        });
        return;
    }
    if ("code" in err && err.code === 11000) {
        res.status(409).json({
            status: "error",
            error: { code: "DUPLICATE_RESOURCE", message: "El recurso ya existe." },
        });
        return;
    }

    console.error(err.stack);
    const statusCode =
        "statusCode" in err &&
        typeof err.statusCode === "number" &&
        err.statusCode >= 400 &&
        err.statusCode < 600
            ? err.statusCode
            : 500;
    const code =
        "code" in err && typeof err.code === "string"
            ? err.code
            : "INTERNAL_SERVER_ERROR";

    res.status(statusCode).json({
        status: "error",
        error: {
            code,
            message: statusCode === 500 ? "Ocurrió un error interno." : err.message,
        },
    });
}
    