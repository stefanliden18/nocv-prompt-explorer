export function getInterviewMessageTemplate(
  candidateName: string,
  jobTitle: string
): string {
  return `Hej ${candidateName}!

Vi har granskat din ansökan till tjänsten som ${jobTitle} och är imponerade av din profil. Vi skulle gärna vilja träffa dig för en videointervju.

Under intervjun kommer vi att diskutera:
- Din bakgrund och erfarenhet
- Dina förväntningar på rollen
- Företaget och teamet

Intervjun beräknas ta cirka 45 minuter.

Ser fram emot att träffa dig!

Med vänliga hälsningar,
Rekryteringsavdelningen`;
}

export function getReminderEmailTemplate(
  candidateName: string,
  jobTitle: string,
  interviewDate: string,
  interviewTime: string,
  interviewLink: string
): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0;">Påminnelse: Intervju imorgon</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hej ${candidateName}!</p>
    <p style="font-size: 16px; margin-bottom: 20px;">Detta är en vänlig påminnelse om att du har en intervju schemalagd imorgon för tjänsten som ${jobTitle}.</p>
    
    <div style="background: #f7f7f7; padding: 20px; border-radius: 8px; margin: 25px 0;">
      <p style="margin: 8px 0;"><strong>📅 Datum:</strong> ${interviewDate}</p>
      <p style="margin: 8px 0;"><strong>🕒 Tid:</strong> ${interviewTime}</p>
      <p style="margin: 8px 0;"><strong>📍 Plats:</strong> Videointervju</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${interviewLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
        Gå med i intervjun
      </a>
    </div>
    
    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 25px 0; border-radius: 4px;">
      <p style="margin: 0; color: #856404;"><strong>💡 Tips inför intervjun:</strong></p>
      <ul style="margin: 10px 0; padding-left: 20px; color: #856404;">
        <li>Testa din kamera och mikrofon i förväg</li>
        <li>Se till att du har en stabil internetanslutning</li>
        <li>Välj en lugn plats utan störande moment</li>
      </ul>
    </div>
    
    <p style="color: #666; font-size: 14px; margin-top: 30px;">
      Vi ser fram emot att träffa dig!
    </p>
    
    <p style="color: #666; font-size: 14px;">
      Med vänliga hälsningar,<br>
      Rekryteringsavdelningen
    </p>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
    <p>Detta är ett automatiskt meddelande, vänligen svara inte på detta mail.</p>
  </div>
  
</body>
</html>`;
}

export function getInvitationEmailTemplate(
  candidateName: string,
  jobTitle: string,
  message: string,
  interviewDate: string,
  interviewTime: string,
  interviewLink: string,
  isUpdate: boolean = false
): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0;">${isUpdate ? 'Uppdaterad ' : ''}Inbjudan till intervju</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; margin-bottom: 20px; white-space: pre-wrap;">${message}</p>
    
    <div style="background: #f7f7f7; padding: 20px; border-radius: 8px; margin: 25px 0;">
      <p style="margin: 8px 0;"><strong>📅 Datum:</strong> ${interviewDate}</p>
      <p style="margin: 8px 0;"><strong>🕒 Tid:</strong> ${interviewTime}</p>
      <p style="margin: 8px 0;"><strong>📍 Plats:</strong> Videointervju</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${interviewLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
        Gå med i intervjun
      </a>
    </div>
    
    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 25px 0; border-radius: 4px;">
      <p style="margin: 0; color: #856404;"><strong>💡 Tips inför intervjun:</strong></p>
      <ul style="margin: 10px 0; padding-left: 20px; color: #856404;">
        <li>Testa din kamera och mikrofon i förväg</li>
        <li>Se till att du har en stabil internetanslutning</li>
        <li>Välj en lugn plats utan störande moment</li>
      </ul>
    </div>
    
    <p style="color: #666; font-size: 14px; margin-top: 30px;">
      Om du behöver ändra tiden eller har frågor, vänligen kontakta oss så snart som möjligt.
    </p>
    
    <p style="color: #666; font-size: 14px;">
      Med vänliga hälsningar,<br>
      Rekryteringsavdelningen
    </p>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
    <p>Detta är ett automatiskt meddelande, vänligen svara inte på detta mail.</p>
  </div>
  
</body>
</html>`;
}

export function getCancellationEmailTemplate(
  candidateName: string,
  jobTitle: string
): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  
  <div style="background: #6c757d; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0;">Intervju avbokad</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hej ${candidateName}!</p>
    <p style="font-size: 16px; margin-bottom: 20px;">Vi måste tyvärr meddela att intervjun för tjänsten som ${jobTitle} har blivit avbokad.</p>
    <p style="font-size: 16px; margin-bottom: 20px;">Vi kommer att kontakta dig om vi önskar boka en ny tid.</p>
    <p style="font-size: 16px; margin-bottom: 20px;">Tack för din förståelse.</p>
    
    <p style="color: #666; font-size: 14px; margin-top: 30px;">
      Med vänliga hälsningar,<br>
      Rekryteringsavdelningen
    </p>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
    <p>Detta är ett automatiskt meddelande, vänligen svara inte på detta mail.</p>
  </div>
  
</body>
</html>`;
}
