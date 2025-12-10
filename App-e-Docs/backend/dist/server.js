"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const PORT = process.env.PORT;
const cors_1 = __importDefault(require("cors"));
// Db connettion
const db_config_1 = __importDefault(require("./config/db.config"));
const roles_model_1 = __importDefault(require("./models/roles.model"));
const users_model_1 = __importDefault(require("./models/users.model"));
const documents_model_1 = __importDefault(require("./models/documents.model"));
const auditLogs_model_1 = __importDefault(require("./models/auditLogs.model"));
const associations_model_1 = require("./models/associations.model");
// seeder
const roles_seeding_1 = require("./seeding/roles.seeding");
// ambil file di routes
const users_route_1 = __importDefault(require("./routes/users.route"));
const auth_route_1 = __importDefault(require("./routes/auth.route"));
const documents_route_1 = __importDefault(require("./routes/documents.route"));
const audit_route_1 = __importDefault(require("./routes/audit.route"));
// Middleware
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.set("trust proxy", true);
app.use((0, cors_1.default)({
    origin: "http://localhost:3000",
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
    credentials: true,
}));
app.use("/api/users", users_route_1.default);
app.use("/api/auth", auth_route_1.default);
app.use("/api/document", documents_route_1.default);
app.use("/api/audit", audit_route_1.default);
async function initializeServer() {
    try {
        await db_config_1.default.authenticate();
        console.log("✅ Koneksi database berhasil.");
        (0, associations_model_1.setupAssociations)();
        await roles_model_1.default.sync({ alter: true });
        await users_model_1.default.sync({ alter: true });
        await documents_model_1.default.sync({ alter: true });
        await auditLogs_model_1.default.sync({ alter: true });
        await (0, roles_seeding_1.seedRoles)();
        console.log("✅ Database disinkronkan. Tabel siap.");
        app.listen(PORT, () => {
            console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
        });
    }
    catch (error) {
        console.error("❌ Gagal memulai server atau inisialisasi database:", error);
        process.exit(1);
    }
}
initializeServer();
