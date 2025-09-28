function buildHeader(title) {
  return `
    <div style="background:linear-gradient(to right,#34d399,#22d3ee,#60a5fa); 
                padding:20px; text-align:center; color:white;">
      <img src="https://gymbuket.s3.ap-southeast-1.amazonaws.com/FitXGym+1.png" 
           alt="FitX Gym" style="height:50px; margin-bottom:10px;" />
      <h1 style="margin:0; font-size:22px;">${title}</h1>
    </div>
  `;
}

function buildFooter() {
  return `
    <div style="background:#f5f5f5; padding:12px; text-align:center; 
                font-size:12px; color:#666;">
      © ${new Date().getFullYear()} FitX Gym. All rights reserved.
    </div>
  `;
}

module.exports = { buildHeader, buildFooter };
