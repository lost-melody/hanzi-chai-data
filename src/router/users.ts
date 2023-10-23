import { Router } from "itty-router";
import * as users from "../controller/users";

export const routerUsers = Router({ base: "/api/users" })
	.get("/", users.List)
	.get("/:id", users.Info);
