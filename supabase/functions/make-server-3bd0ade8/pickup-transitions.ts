export function installPickupTransitions(app: any, supabase: any) {
  for (const action of ['assign', 'pickup', 'complete', 'cancel']) {
    app.post(`/make-server-3bd0ade8/pickup-requests/:id/${action}`, async (c: any) => {
      const actor = c.get('staff');
      if (!actor) return c.json({success:false,error:'Please sign in'},401);
      let driverId = null;
      if (action === 'assign') {
        try {
          const body = await c.req.json();
          if (typeof body.driverId !== 'string') throw new Error();
          driverId = body.driverId;
        } catch { return c.json({success:false,error:'Driver is required'},400); }
      }
      const {data,error} = await supabase.rpc('transition_pickup', {
        p_id:c.req.param('id'),p_action:action,p_actor_role:actor.role,
        p_actor_id:actor.role === 'driver' ? actor.driverId : null,p_driver_id:driverId,
      });
      if (error) return c.json({success:false,error:'Request unavailable or action not permitted. Refresh and try again.'},409);
      return c.json({success:true,request:data});
    });
  }
}

