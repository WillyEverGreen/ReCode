// USAGE RESET TOOL
// Copy and paste this into your browser console while logged in

async function resetMyUsage() {
  console.log("🧹 Resetting your usage...\n");
  
  const token = localStorage.getItem("token");
  if (!token) {
    console.error("❌ No token found. Please login first.");
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/api/usage/reset", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ action: "clear-my-usage" })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log("✅ ", data.message);
      console.log("🔄 Refreshing usage display...");
      
      // Trigger usage refresh
      window.dispatchEvent(new Event("usage-updated"));
      
      console.log("\n✨ Your usage has been reset!");
      console.log("📊 You now have:");
      console.log("   Get Solution: 0/3");
      console.log("   Add Solution: 0/2");
      console.log("\n🎉 You can now use the app normally!");
    } else {
      console.error("❌ Failed:", data.error);
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

// Alternative: Reset only today's usage
async function resetTodayUsage() {
  console.log("🧹 Resetting today's usage...\n");
  
  const token = localStorage.getItem("token");
  if (!token) {
    console.error("❌ No token found. Please login first.");
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/api/usage/reset", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ action: "clear-today" })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log("✅ ", data.message);
      window.dispatchEvent(new Event("usage-updated"));
      console.log("\n✨ Today's usage has been reset!");
    } else {
      console.error("❌ Failed:", data.error);
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

console.log("🛠️  USAGE RESET TOOL LOADED");
console.log("\n📋 Available commands:");
console.log("   resetMyUsage()      - Clear all your usage history");
console.log("   resetTodayUsage()   - Clear only today's usage");
console.log("\n💡 Example: Just type 'resetMyUsage()' and press Enter");
