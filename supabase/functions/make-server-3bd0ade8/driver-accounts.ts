import { publicDriver, type DriverProfile } from './staff-access.ts';

export async function driverAuthEmail(id: string) {
  const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(id));
  const key=Array.from(new Uint8Array(bytes),x=>x.toString(16).padStart(2,'0')).join('');
  return `driver-${key.slice(0,40)}@drivers.hoponsintra.invalid`;
}

export function installDriverAccounts(app: any, deps: {
  supabase: any; authClient: () => any; getDrivers: () => Promise<DriverProfile[]>;
}) {
  const {supabase,getDrivers}=deps;
  const save=async(profile:Partial<DriverProfile>,remove=false)=>{
    const {data,error}=await supabase.rpc('save_driver_profile',{p_driver:profile,p_delete:remove});
    if(error)throw new Error('Unable to save driver profile'); return data;
  };
  const base='/make-server-3bd0ade8';
  app.get(base+'/drivers',async(c:any)=>c.json({success:true,drivers:(await getDrivers()).map(publicDriver)}));
  app.get(base+'/drivers/session',async(c:any)=>{
    const actor=c.get('staff');
    if(actor?.role!=='driver')return c.json({success:false,error:'Driver session required'},403);
    const driver=(await getDrivers()).find(d=>d.id===actor.driverId);
    return c.json({success:true,driver:publicDriver(driver!)});
  });
  app.post(base+'/drivers/login',async(c:any)=>{
    c.header('Cache-Control','no-store');
    try {
      const {username,password}=await c.req.json();
      if(typeof username!=='string'||typeof password!=='string'||username.length>100||!password||password.length>1024)
        return c.json({success:false,error:'Invalid credentials'},401);
      const name=username.trim().toLowerCase();
      const {data:allowed,error:limitError}=await supabase.rpc('allow_driver_login',{p_username:name});
      if(limitError)throw limitError;
      if(!allowed)return c.json({success:false,error:'Sign-in unavailable. Check your credentials or try again in 15 minutes.'},429);
      const profile=(await getDrivers()).find(d=>d.username.trim().toLowerCase()===name);
      if(!profile?.authUserId||['inactive','disabled'].includes(profile.status))return c.json({success:false,error:'Invalid credentials'},401);
      const {data,error}=await deps.authClient().auth.signInWithPassword({email:await driverAuthEmail(profile.id),password});
      if(error||!data.session||data.user?.id!==profile.authUserId||data.user?.app_metadata?.role!=='driver'||
        data.user?.app_metadata?.driver_version!==profile.authVersion)return c.json({success:false,error:'Invalid credentials'},401);
      const updated=await save({id:profile.id,status:'online',lastLoginAt:new Date().toISOString()});
      return c.json({success:true,driver:publicDriver(updated),session:{access_token:data.session.access_token,refresh_token:data.session.refresh_token}});
    }catch{return c.json({success:false,error:'Sign-in unavailable'},503);}
  });
  app.post(base+'/drivers/logout',async(c:any)=>{
    try {
      const actor=c.get('staff'); const {driverId}=await c.req.json();
      if(actor.role==='driver'){
        const token=c.req.header('Authorization').replace(/^Bearer\s+/i,'');
        const {error}=await supabase.auth.admin.signOut(token,'local'); if(error)throw error;
      }
      await save({id:driverId,status:'offline',lastLogoutAt:new Date().toISOString()});
      return c.json({success:true});
    }catch{return c.json({success:false,error:'Unable to sign out'},503);}
  });
  const fields=(body:any)=>{
    const result:Record<string,unknown>={};
    for(const key of ['name','username','phoneNumber','vehicleType','licenseNumber','status']){
      if(body[key]!==undefined){if(typeof body[key]!=='string'||body[key].length>160)throw new Error('Invalid profile');result[key]=body[key].trim();}
    }
    if(result.username!==undefined&&!/^[a-z0-9._-]{3,64}$/i.test(String(result.username)))throw new Error('Invalid username');
    if(result.status!==undefined&&!['active','inactive','online','offline'].includes(String(result.status)))throw new Error('Invalid status');
    if(body.vehicleCategory!==undefined){if(!['tuk_tuk','other',''].includes(body.vehicleCategory))throw Error('Invalid vehicle category');result.vehicleCategory=body.vehicleCategory;}
    if(body.passengerCapacity!==undefined){if(!Number.isInteger(body.passengerCapacity)||body.passengerCapacity<0||body.passengerCapacity>50)throw Error('Invalid seat count');result.passengerCapacity=body.passengerCapacity;}
    return result;
  };
  app.post(base+'/drivers/create',async(c:any)=>{
    let createdId:string|undefined;
    try {
      const body=await c.req.json();const profile=fields(body);
      if(!profile.name||!profile.username||typeof body.password!=='string'||body.password.length<12||body.password.length>1024)
        return c.json({success:false,error:'Name, username and a password of at least 12 characters are required'},400);
      const id=`driver_${crypto.randomUUID()}`, version=crypto.randomUUID();
      const {data,error}=await supabase.auth.admin.createUser({email:await driverAuthEmail(id),password:body.password,email_confirm:true,
        app_metadata:{role:'driver',driver_id:id,driver_version:version}});
      if(error||!data.user)throw new Error('Unable to create login'); createdId=data.user.id;
      const saved=await save({...profile,id,authUserId:createdId,authVersion:version,status:String(profile.status||'active'),createdAt:new Date().toISOString()});
      return c.json({success:true,driver:publicDriver(saved)});
    }catch{
      if(createdId)await supabase.auth.admin.deleteUser(createdId);
      return c.json({success:false,error:'Unable to create driver. Check the username and password requirements.'},400);
    }
  });
  app.put(base+'/drivers/:id',async(c:any)=>{
    try {
      const id=c.req.param('id'),body=await c.req.json(),profile=fields(body);
      const drivers=await getDrivers();
      const current=drivers.find(d=>d.id===id);
      if(!current?.authUserId)return c.json({success:false,error:'Driver not found or not migrated'},404);
      if(profile.username && drivers.some(d=>d.id!==id && d.username.trim().toLowerCase()===String(profile.username).toLowerCase()))
        return c.json({success:false,error:'Username already taken'},400);
      if(body.password){
        if(typeof body.password!=='string'||body.password.length<12||body.password.length>1024)return c.json({success:false,error:'Use at least 12 characters'},400);
        const version=crypto.randomUUID();
        const {error}=await supabase.auth.admin.updateUserById(current.authUserId,{password:body.password,
          app_metadata:{role:'driver',driver_id:id,driver_version:version}});
        if(error)throw error;profile.authVersion=version;
      }
      const saved=await save({...profile,id});
      return c.json({success:true,driver:publicDriver(saved)});
    }catch{return c.json({success:false,error:'Unable to update driver. Check the username and retry.'},400);}
  });
  app.delete(base+'/drivers/:id',async(c:any)=>{
    try {
      const id=c.req.param('id'),current=(await getDrivers()).find(d=>d.id===id);
      if(!current)return c.json({success:false,error:'Driver not found'},404);
      // Removing the profile immediately denies operations, even if Auth cleanup fails.
      await save({id},true);
      if(current.authUserId){const {error}=await supabase.auth.admin.deleteUser(current.authUserId);if(error)throw error;}
      return c.json({success:true});
    }catch{return c.json({success:false,error:'Unable to finish removing driver'},503);}
  });
}

