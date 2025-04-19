import { httpRouter } from "convex/server";
import {WebhookEvent} from '@clerk/nextjs/server'
import {httpAction} from './_generated/server'
import {Webhook} from "svix"
import {api} from './_generated/api'

const http = httpRouter();

http.route({
  path:'/clerk-webhook',
  method :"POST",
  handler: httpAction(async (cntx,req)=>{
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET!;
    if(!webhookSecret) {
      throw new Error("Missing CLERK_WEBHOOK_SECRET env var")
    };

    const svix_id = req.headers.get("svix-id");
    const svix_signature = req.headers.get('svix-signature');
    const svix_timestamp = req.headers.get('svix-timestamp');

    if(!svix_id || !svix_signature || !svix_timestamp){
      return new Response("No svix headers found",{
        status: 400,
      })
    }

    const payload = await req.json();
    const body = JSON.stringify(payload);

    const wh = new Webhook(webhookSecret);
    let evt: WebhookEvent;

    try {
      evt = wh.verify(body,{
        "svix-id": svix_id,
        "svix-signature": svix_signature,
        "svix-timestamp": svix_timestamp,
      }) as WebhookEvent
    } catch (err) {
      console.error("error verifying webhook",err);
      return new Response("Error occured", {status: 400})
    }

    const evtType=  evt.type;
    if(evtType=== "user.created"){

      const {id,first_name,last_name,image_url,email_addresses} = evt.data;

      const email = email_addresses[0].email_address;
      const name = `${first_name || ""} ${last_name || ""}`.trim();

      try {
        await cntx.runMutation(api.users.syncUser,{
          email,
          name,
          image:image_url,
          clerkId:id
        })
      } catch (error) {
        console.log("Error Creting user", error);
        return new Response("The Error creating user",{status:500})
      }
 
    }

    return new Response("Webhooks processed successfully",{status:200})

  })

})

export default http;