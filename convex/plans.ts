import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const createPlan = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    workoutPlan: v.object({
      schedule: v.array(v.string()),
      exercises: v.array(
        v.object({
          day: v.string(),
          routines: v.array(
            v.object({
              name: v.string(),
              sets: v.number(),
              reps: v.number(),
            })
          ),
        })
      ),
    }),
    dietPlan: v.object({
      dailyCalories: v.number(),
      meals: v.array(
        v.object({
          name: v.string(),
          foods: v.array(v.string()),
        })
      ),
    }),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {

    const activePlans = await ctx.db
      .query("plans")
      .withIndex("by_user_id",(id)=>id.eq("userId",args.userId))
      .filter((id)=>id.eq(id.field("isActive"),true))
      .collect()

    // deactivate the id's
    for(const plan of activePlans){
      await ctx.db.patch(plan._id,{isActive:false})
    }

    // Push into the db
    const planId = await ctx.db.insert("plans",args);

    return planId;
  }
})