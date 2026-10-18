// Install in a NEW standalone project. Never add to the Retell project.
function doPost(e) {
  var output = function(value) { return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON); };
  var lock = LockService.getScriptLock();
  try {
    if (!e || !e.postData || e.postData.contents.length > 12000) return output({ok:false});
    var data = JSON.parse(e.postData.contents);
    var props = PropertiesService.getScriptProperties();
    var secret = props.getProperty('DEMO_SCRIPT_SECRET');
    var recipient = props.getProperty('DEMO_NOTIFY_EMAIL');
    if (!secret || secret.length < 32 || data.secret !== secret || !recipient || !/^[a-f0-9]{64}$/.test(data.id)) return output({ok:false});
    var f = data.fields;
    var limits = {name:100,business:150,email:200,phone:30,message:2000};
    if (!f) return output({ok:false});
    for (var key in limits) {
      if (typeof f[key] !== 'string' || f[key].length > limits[key] || (key !== 'phone' && !f[key].trim())) return output({ok:false});
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email) || /[\r\n]/.test(f.email) || (f.phone && !/^[+0-9() .-]{7,30}$/.test(f.phone))) return output({ok:false});
    if (!lock.tryLock(3000)) return output({ok:false});
    var now = Date.now();
    var all = props.getProperties();
    // Seven-day deduplication. Store only hashes and state, never submission content.
    Object.keys(all).forEach(function(k) { if (k.indexOf('receipt:') === 0 && Number(all[k].split(':')[1]) < now - 7*86400000) props.deleteProperty(k); });
    var receipt = 'receipt:' + data.id;
    var previous = props.getProperty(receipt);
    if (previous) return output({ok:previous.indexOf('sent:') === 0,id:data.id});
    if (MailApp.getRemainingDailyQuota() < 1) return output({ok:false});
    // Reserve BEFORE sending. An ambiguous failure must not automatically resend.
    props.setProperty(receipt,'pending:' + now);
    MailApp.sendEmail({to:recipient,subject:'VoiceFlow AI demo request',replyTo:f.email,
      body:['New website demo request', 'Request ID: '+data.id].concat(Object.keys(limits).map(function(k) { return k+': '+(f[k] || 'Not provided'); })).join('\n\n')});
    props.setProperty(receipt,'sent:' + now);
    return output({ok:true,id:data.id});
  } catch (error) { return output({ok:false}); }
  finally { if (lock.hasLock()) lock.releaseLock(); }
}
