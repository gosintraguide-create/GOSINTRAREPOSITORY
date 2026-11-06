// Shared entry point delegates to the existing rate-limited identity checks.
// Choosing a screen or submitting a role never grants access.
export function createStaffPasswordLogin(login:(path:string,body:any)=>Promise<Response>) {
 return async(c:any)=>{
  c.header('Cache-Control','no-store');
  try {
   const body=await c.req.json();
   if(typeof body.username!=='string'||typeof body.password!=='string'||body.username.length>100||!body.password||body.password.length>1024)return c.json({success:false,error:'Invalid credentials'},401);
   const name=body.username.trim().toLowerCase();
   const admin=['vascotimm','vascotimm@gmail.com'].includes(name);
   const response=await login(admin?'/admin/login':'/drivers/login',{username:admin?'vascotimm':name,password:body.password});
   const value=await response.json();
   if(!response.ok||!value.session)return c.json({success:false,error:value.error||'Invalid credentials'},response.ok?401:response.status);
   return c.json({success:true,role:admin?'admin':'driver',session:value.session});
  }catch{return c.json({success:false,error:'Sign-in unavailable'},503);}
 };
}
