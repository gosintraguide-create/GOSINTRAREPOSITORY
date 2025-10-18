# Database Quick Reference Card

## 🚦 Status Check (30 seconds)

```
1. Go to: Admin → Diagnostics
2. Click: "Test Connection"
3. Expected: ✅ Green "Database Connected!"
4. Click: "Run Diagnostics"  
5. Expected: ✅ "All good! No duplicate rows"
```

**Done!** If both are green, everything is working perfectly.

---

## 📊 What's Normal vs What's Not

### ✅ NORMAL (Don't Worry)

| What You See | Why It's Normal |
|--------------|-----------------|
| 0 Storage Requests in Supabase | Using Database, not Storage |
| "Duplicate" warnings in logs | Upsert updating existing keys |
| Keys = Rows in diagnostics | Perfect! No actual duplicates |
| Saves take 1-2 seconds | Normal database latency |

### ❌ NOT NORMAL (Needs Attention)

| What You See | What To Do |
|--------------|------------|
| Rows > Keys in diagnostics | Click "Clean Up Duplicates" |
| "Failed to run diagnostics" | Check [DIAGNOSTICS_TROUBLESHOOTING.md](./DIAGNOSTICS_TROUBLESHOOTING.md) |
| Content saves fail | Check server logs in Edge Functions |
| Changes don't persist | Verify database connection |

---

## 🔑 Database Keys Explained

| Key | What It Stores | When It's Created |
|-----|----------------|-------------------|
| `db_initialized` | Initialization flag | First server start |
| `website_content` | Simple content (AdminPage) | First content save |
| `comprehensive_content` | Advanced content (ContentEditor) | First comprehensive save |
| `pricing_config` | Prices for passes/tours | Admin pricing save |
| `availability_YYYY-MM-DD` | Seat counts per day | First booking for date |
| `booking_current_prefix` | Current ID prefix (AA, AB...) | First booking |
| `AA-####` | Individual bookings | Each booking |
| `checkin_AA-####_0` | Passenger check-ins | QR scan |
| `chat_conversation_xxx` | Chat conversations | Chat start |
| `pickup_request_xxx` | Pickup requests | Request created |

---

## 🛠️ Quick Fixes

### "Diagnostics Failed"
```bash
# Test the connection first
Admin → Diagnostics → "Test Connection"

# If that fails, check:
1. Supabase Dashboard → Edge Functions → make-server-3bd0ade8 → Check if deployed
2. Supabase Dashboard → Table Editor → Look for kv_store_3bd0ade8
3. Browser Console (F12) → Look for error messages
```

### "Content Won't Save"
```bash
# Check which system you're using
AdminPage → Content Manager = saves to website_content
AdminPage → Content Editor = saves to comprehensive_content

# Verify save worked:
Supabase Dashboard → Table Editor → kv_store_3bd0ade8 → Look for your key
```

### "Need to Clear Database"
```bash
# DON'T! Just reset specific keys:
Admin → Diagnostics → "Run Diagnostics"
If duplicates found → Click "Clean Up Duplicates"

# Or reset via SQL Editor:
DELETE FROM kv_store_3bd0ade8 WHERE key = 'your_key';
```

---

## 📍 Where Is Everything?

### Your Data
```
Supabase Dashboard
  → Table Editor
    → kv_store_3bd0ade8 table  ← YOUR DATA IS HERE
```

### NOT Here (You Don't Use This)
```
Supabase Dashboard
  → Storage  ← NOT USED (so 0 requests is normal!)
```

### Diagnostics Tool
```
Your Site
  → Admin Panel
    → Diagnostics Tab
      → Database Diagnostics card
```

### Server Logs
```
Supabase Dashboard
  → Edge Functions
    → make-server-3bd0ade8
      → Logs tab
```

---

## 🎯 One-Minute Health Check

```bash
✅ Test Connection → Green?
✅ Run Diagnostics → No duplicates?
✅ Save content → Success message?
✅ Refresh page → Changes persist?
✅ Check Supabase → Table has rows?

All ✅? You're good! 🎉
```

---

## 🆘 Common Questions

**Q: Why 0 storage requests?**  
A: You use Database (table), not Storage (blob storage). This is normal!

**Q: What are "duplicate" warnings?**  
A: Normal! It's the database updating keys (upsert). Not an error.

**Q: How many keys should I have?**  
A: Depends on usage. New site: 3-5 keys. Active site: 50+ keys.

**Q: Keys should equal rows?**  
A: Yes! If Keys = Rows, no duplicates. If Rows > Keys, duplicates exist.

**Q: How do I backup my data?**  
A: Supabase Dashboard → Database → Backups (automatic daily backups)

**Q: Can I query the database directly?**  
A: Yes! Supabase Dashboard → SQL Editor:
```sql
SELECT * FROM kv_store_3bd0ade8;
```

---

## 📚 Full Documentation

- **Quick Status:** [DATABASE_STATUS.md](./DATABASE_STATUS.md)
- **The Fix:** [DATABASE_SAVE_FIX.md](./DATABASE_SAVE_FIX.md)
- **Storage Explained:** [SUPABASE_STORAGE_EXPLAINED.md](./SUPABASE_STORAGE_EXPLAINED.md)
- **Troubleshooting:** [DIAGNOSTICS_TROUBLESHOOTING.md](./DIAGNOSTICS_TROUBLESHOOTING.md)

---

## 💡 Pro Tips

1. **Before making changes:** Always "Test Connection" first
2. **After updates:** Run "Diagnostics" to verify everything's clean
3. **If stuck:** Check browser console (F12) for error details
4. **For backups:** Supabase auto-backs up daily (Settings → Database → Backups)
5. **To reset:** Delete specific keys, don't drop the whole table

---

## ⚡ Emergency Contacts

| Issue | Document |
|-------|----------|
| Can't save content | [DATABASE_SAVE_FIX.md](./DATABASE_SAVE_FIX.md) |
| Diagnostics failing | [DIAGNOSTICS_TROUBLESHOOTING.md](./DIAGNOSTICS_TROUBLESHOOTING.md) |
| "What's storage?" | [SUPABASE_STORAGE_EXPLAINED.md](./SUPABASE_STORAGE_EXPLAINED.md) |
| General questions | [DATABASE_STATUS.md](./DATABASE_STATUS.md) |

---

**Everything working?** Great! You don't need this card. 🎉  
**Something broken?** Follow the guide for your issue above. 🔧
