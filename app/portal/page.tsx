import { requireChatGPTUser } from "../chatgpt-auth";
import Workspace from "../workspace";
export const dynamic="force-dynamic";
export const metadata={title:"Partner portal | SWAY IRL"};
export default async function Portal(){const user=await requireChatGPTUser("/portal");return <Workspace user={user}/>}
