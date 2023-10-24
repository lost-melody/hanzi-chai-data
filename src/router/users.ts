import { Router } from "itty-router";
import { authorizedUser, authorizedAdmin } from "../middleware/jwt";
import * as users from "../controller/users";

export const routerUsers = Router({ base: "/api/users" })
	.get("/", users.List)
	.get("/:id", users.Info)
	.post("/", authorizedUser, authorizedAdmin, users.Create)
	.delete("/:id", authorizedUser, authorizedAdmin, users.Delete);
