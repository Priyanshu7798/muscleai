import { mutation } from "./_generated/server";
import {v} from 'convex/values'

export const syncUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    clerkId: v.string(),
    image: v.optional(v.string()),
  },
  handler: async (cntx ,args)=>{
    const user = await cntx.db
      .query("users")
      .filter((user)=>user.eq(user.field("clerkId"),args.clerkId))
      .first();

    if(user) return ;

    return await cntx.db.insert("users",args)
  }
})