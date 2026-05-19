// Component-specific translations
// TODO: These will be merged into the main translations file

export interface ComponentTranslations {
  liveChat: {
    liveSupport: string;
    hereToHelp: string;
    chatOnWhatsApp: string;
    orStartWebChat: string;
    startWebChat: string;
    starting: string;
    conversationSaved: string;
    welcomeMessage: string;
    enterName: string;
    enterEmail: string;
    enterMessage: string;
    sendMessage: string;
    goBack: string;
  };
  
  userProfile: {
    myAccount: string;
    quickAccess: string;
    loginToProfile: string;
    myBooking: string;
    requestRide: string;
    accessYourBooking: string;
    loginDescription: string;
    bookingId: string;
    bookingIdPlaceholder: string;
    lastName: string;
    lastNamePlaceholder: string;
    login: string;
    loggingIn: string;
    welcomeBack: string;
    loggedOut: string;
    pleaseEnterBoth: string;
    invalidCredentials: string;
    loginFailed: string;
    logout: string;
    yourPasses: string;
    validFor: string;
  };
  
  requestPickupPage: {
    verifyBooking: string;
    verifyBookingDescription: string;
    requestPickup: string;
    requestPickupDescription: string;
    enterName: string;
    groupSize: string;
    pickupLocation: string;
    requestingSent: string;
    pickupRequested: string;
    pickupRequestedMessage: string;
    errorRequestingPickup: string;
  };
  
  bookingConfirmation: {
    bookingConfirmed: string;
    checkEmail: string;
    bookingId: string;
    saveForManaging: string;
    emailSentTo: string;
    ticketsSentToEmail: string;
    bookingSummary: string;
    booking: string;
    date: string;
    passengers: string;
    person: string;
    people: string;
    totalPaid: string;
    yourDayPassTickets: string;
    downloadPDF: string;
    downloading: string;
    printAll: string;
    pdfTicketsAttached: string;
    pdfTicketsAttachedDesc: string;
    ticketsReady: string;
    ticketsReadyDesc: string;
    howToUseYourPass: string;
    showQRCode: string;
    showQRCodeDesc: string;
    unlimitedRides: string;
    unlimitedRidesDesc: string;
    regularService: string;
    regularServiceDesc: string;
    flexibleSchedule: string;
    flexibleScheduleDesc: string;
    thankYou: string;
    adventureBegins: string;
    confirmationSentTo: string;
    backToHome: string;
    manageBooking: string;
    viewAttractions: string;
    tip: string;
    tipUseBookingId: string;
    viewRouteMap: string;
    questionsOrChanges: string;
    contactViaEmail: string;
    or: string;
    unlockFullAccess: string;
    loginNow: string;
    requestPickup: string;
    requestPickupDesc: string;
    liveChatSupport: string;
    liveChatSupportDesc: string;
    viewTickets: string;
    viewTicketsDesc: string;
    loginInstantly: string;
    loginNowButton: string;
    youreLoggedIn: string;
    fullAccessEnabled: string;
    requestPickupFrom: string;
    downloadTickets: string;
    downloadingTickets: string;
    noBookingFound: string;
    bookNow: string;
    insightTourPickup: string;
    departsAt: string;
    meetingPoint: string;
    arriveEarly: string;
    lookForVehicle: string;
    pdfDownloadSuccess: string;
    pdfDownloadError: string;
  };
  
  buyTicketPage: {
    stepDescriptions: {
      step1: string;
      step2: string;
    };
    progressLabels: {
      dateTime: string;
      pickupSpot: string;
      attractions: string;
      yourDetails: string;
      confirmation: string;
    };
    toasts: {
      paymentInitFailed: string;
      bookingConfirmedCheckEmail: string;
      bookingConfirmedQRReady: string;
      emailVerificationWarning: string;
      emailNoAddress: string;
      emailErrorWithDetails: string;
      emailCouldntBeSent: string;
      serverConnectionIssue: string;
      paymentFailed: string;
    };
    paymentError: {
      title: string;
      message: string;
      retry: string;
      goBack: string;
    };
    bookingErrors: {
      failedMultipleAttempts: string;
      failedToCreate: string;
      failedToComplete: string;
    };
    insightTourInfo: {
      title: string;
      description: string;
      badge: string;
    };
    soldOut: {
      title: string;
      description: string;
      badge: string;
    };
    step1: {
      selectDate: string;
      departureTime: string;
      seatsLeft: string;
      note: string;
    };
    step2: {
      title: string;
      description: string;
      total: string;
    };
    step3: {
      title: string;
      skipTicketLines: string;
      pricesShownFor: string;
      guests: string;
      notAvailable: string;
      each: string;
      tipTitle: string;
      tipDescription: string;
      dayPassQRCode: string;
      dayPassQRCodes: string;
      comingSoon: {
        badge: string;
        description: string;
        tip: string;
      };
    };
    step4: {
      title: string;
      fullName: string;
      emailAddress: string;
      confirmEmail: string;
      qrCodeSentHere: string;
      emailsDontMatch: string;
    };
    step5: {
      orderSummary: string;
      startingAt: string;
      guest: string;
      guests: string;
      dayPass: string;
      guided: string;
      attractionTickets: string;
      includesGuidedCommentary: string;
      paymentDetails: string;
      preparingPayment: string;
      benefits: {
        unlimited: string;
        guaranteedSeating: string;
        flexible: string;
        qrCode: string;
        qrCodes: string;
        sentViaEmail: string;
        guidedCommentary: string;
      };
    };
    common: {
      back: string;
      continue: string;
      total: string;
    };
  };
  
  aboutPage: {
    sendMessage: string;
    sending: string;
    messageSent: string;
    messageError: string;
    fullName: string;
    emailAddress: string;
  };
  
  toast: {
    newVersionAvailable: string;
    contentUpdated: string;
    loginSuccess: string;
    loginError: string;
    settingsSaved: string;
    settingsSaveFailed: string;
    availabilitySaved: string;
    availabilitySaveFailed: string;
    contentSaved: string;
    contentSaveFailed: string;
  };
}

export const componentTranslations: { [key: string]: ComponentTranslations } = {
  en: {
    liveChat: {
      liveSupport: "Live Support",
      hereToHelp: "We're here to help!",
      chatOnWhatsApp: "Chat on WhatsApp",
      orStartWebChat: "or start web chat",
      startWebChat: "Start Web Chat",
      starting: "Starting...",
      conversationSaved: "Your conversation is saved.",
      welcomeMessage: "Hi! 👋 Welcome to Hop On Sintra. How can we help you today?",
      enterName: "Enter your name",
      enterEmail: "Enter your email",
      enterMessage: "Type your message...",
      sendMessage: "Send",
      goBack: "Go Back"
    },
    
    userProfile: {
      myAccount: "My Account",
      quickAccess: "Quick Access",
      loginToProfile: "Login to Profile",
      myBooking: "My Booking",
      requestRide: "Request a Ride",
      accessYourBooking: "Access Your Booking",
      loginDescription: "Login with your booking ID and last name to access your temporary profile during your visit.",
      bookingId: "Booking ID",
      bookingIdPlaceholder: "e.g., AB-1234",
      lastName: "Last Name",
      lastNamePlaceholder: "e.g., Silva",
      login: "Login",
      loggingIn: "Logging in...",
      welcomeBack: "Welcome back",
      loggedOut: "You've been logged out",
      pleaseEnterBoth: "Please enter both booking ID and last name",
      invalidCredentials: "Invalid booking credentials",
      loginFailed: "Failed to login. Please try again.",
      logout: "Logout",
      yourPasses: "Your Passes",
      validFor: "Valid for"
    },
    
    requestPickupPage: {
      verifyBooking: "Verify Your Booking",
      verifyBookingDescription: "Enter your booking code to request a pickup. This service is only available to customers with active day passes.",
      requestPickup: "Request a Pickup",
      requestPickupDescription: "Tell us your group size and location, and we'll send the perfect vehicle for you.",
      enterName: "Enter your name",
      groupSize: "Group Size",
      pickupLocation: "Pickup Location",
      requestingSent: "Requesting...",
      pickupRequested: "Pickup Requested!",
      pickupRequestedMessage: "We've received your request and will dispatch a vehicle shortly.",
      errorRequestingPickup: "Error requesting pickup"
    },
    
    bookingConfirmation: {
      bookingConfirmed: "Booking Confirmed!",
      checkEmail: "Check your email for confirmation and QR codes.",
      bookingId: "Booking ID",
      saveForManaging: "Save this for managing your booking",
      emailSentTo: "Confirmation email sent to",
      ticketsSentToEmail: "Your tickets PDF and booking details have been sent to your email.",
      bookingSummary: "Booking Summary",
      booking: "Booking",
      date: "Date",
      passengers: "Passengers",
      person: "person",
      people: "people",
      totalPaid: "Total Paid",
      yourDayPassTickets: "Your Day Pass Tickets",
      downloadPDF: "Download PDF",
      downloading: "Downloading...",
      printAll: "Print All",
      pdfTicketsAttached: "PDF Tickets Attached",
      pdfTicketsAttachedDesc: "We've sent a PDF with all your tickets to your email. You can also download it here or save your tickets below.",
      ticketsReady: "Your Tickets Are Ready!",
      ticketsReadyDesc: "Show these tickets to the driver when boarding. Each passenger needs their own ticket with QR code.",
      howToUseYourPass: "How to Use Your Pass",
      showQRCode: "Show QR Code",
      showQRCodeDesc: "Present your QR code to the driver when boarding any vehicle",
      unlimitedRides: "Unlimited Rides",
      unlimitedRidesDesc: "Use your pass for unlimited hop-on/hop-off rides until 8:00 PM",
      regularService: "Regular Service",
      regularServiceDesc: "Consistent service from all major attractions throughout the day",
      flexibleSchedule: "Flexible Schedule",
      flexibleScheduleDesc: "Spend as much time as you want at each attraction",
      thankYou: "Thank You for Choosing Hop On Sintra!",
      adventureBegins: "We're excited to show you the magic of Sintra. Your adventure begins on",
      confirmationSentTo: "Your booking confirmation and tickets have been sent to",
      backToHome: "Back to Homepage",
      manageBooking: "Manage Booking",
      viewAttractions: "View Attractions",
      tip: "Tip",
      tipUseBookingId: "Use your Booking ID {bookingId} to manage your reservation",
      viewRouteMap: "interactive route map",
      questionsOrChanges: "Questions or need to make changes?",
      contactViaEmail: "Contact us via",
      or: "or",
      unlockFullAccess: "Unlock Full Access",
      loginNow: "Login now to access premium features during your visit:",
      requestPickup: "Request a pickup",
      requestPickupDesc: "from any attraction in Sintra",
      liveChatSupport: "Live chat support",
      liveChatSupportDesc: "with saved conversation history",
      viewTickets: "View your tickets",
      viewTicketsDesc: "and booking details anytime",
      loginInstantly: "Use your {bold}Booking ID{/bold} and {bold}last name{/bold} to login instantly.",
      loginNowButton: "Login Now",
      youreLoggedIn: "You're Logged In!",
      fullAccessEnabled: "You have full access to all features including requesting pickups and live chat support. Your tickets and booking details are saved to your profile.",
      requestPickupFrom: "Request Pickup",
      downloadTickets: "Download Tickets",
      downloadingTickets: "Downloading...",
      noBookingFound: "No booking found. Please make a booking first.",
      bookNow: "Book Now",
      insightTourPickup: "Insight Tour - Important Pickup Information",
      departsAt: "Your guided tour departs at",
      meetingPoint: "Meeting Point",
      arriveEarly: "Please arrive 10 minutes early",
      lookForVehicle: "to ensure a prompt departure. Look for our vehicle with the Hop On Sintra branding and show your ticket to the driver.",
      pdfDownloadSuccess: "PDF downloaded successfully!",
      pdfDownloadError: "Failed to download PDF"
    },
    
    buyTicketPage: {
      stepDescriptions: {
        step1: "Select your preferred date and start time",
        step2: "Choose pickup location and number of guests",
      },
      progressLabels: {
        dateTime: "Date & Time",
        pickupSpot: "Pickup Spot",
        attractions: "Attractions",
        yourDetails: "Your Details",
        confirmation: "Confirmation",
      },
      toasts: {
        paymentInitFailed: "Failed to initialize payment. Please try again.",
        bookingConfirmedCheckEmail: "Booking confirmed! Check your email for QR codes.",
        bookingConfirmedQRReady: "Booking confirmed! QR codes are ready.",
        emailVerificationWarning: "⚠️ Email system requires domain verification. QR codes are available on this page.",
        emailNoAddress: "⚠️ No email address provided. Save your QR codes from this page.",
        emailErrorWithDetails: "⚠️ Email couldn't be sent",
        emailCouldntBeSent: "Email couldn't be sent. Save your QR codes from this page.",
        serverConnectionIssue: "Server connection issue. Your payment was processed. Please contact support with your payment confirmation.",
        paymentFailed: "Payment failed. Please try again.",
      },
      paymentError: {
        title: "Payment initialization failed",
        message: "Failed to initialize payment",
        retry: "Retry",
        goBack: "Go Back",
      },
      bookingErrors: {
        failedMultipleAttempts: "Failed to create booking after multiple attempts",
        failedToCreate: "Failed to create booking",
        failedToComplete: "Failed to complete booking. Please try again.",
      },
      insightTourInfo: {
        title: "Insight Tour",
        description: "Select time slots include our Insight Tour, a longer and more detailed ride where the driver shares the stories and history behind Sintra's monuments. Look for time slots marked with the distinctive Insight Tour badge below.",
        badge: "Insight Tour",
      },
      soldOut: {
        title: "Temporarily Unavailable",
        description: "All dates are currently sold out. Please check back later or contact us for availability.",
        badge: "Sold Out",
      },
      step1: {
        selectDate: "Select Date",
        departureTime: "Departure Time",
        seatsLeft: "left",
        note: "Note:",
      },
      step2: {
        title: "Pickup & Group Size",
        description: "Choose your pickup location and number of guests",
        total: "Total",
      },
      step3: {
        title: "Add Attraction Tickets?",
        skipTicketLines: "Skip the ticket lines!",
        pricesShownFor: "Prices shown for",
        guests: "guests.",
        notAvailable: "Attraction tickets are not yet available for online purchase. You can buy tickets at each attraction entrance.",
        each: "each",
        tipTitle: "Tip:",
        tipDescription: "You'll receive digital tickets via email along with your",
        dayPassQRCode: "day pass QR code",
        dayPassQRCodes: "day pass QR codes",
        comingSoon: {
          badge: "Online Booking Coming Soon",
          description: "We're working on adding the ability to purchase attraction tickets online. For now, tickets can be purchased at each attraction entrance.",
          tip: "💡 Your Hop On Sintra day pass gets you unlimited transport to all attractions. Tickets are available for purchase when you arrive!",
        },
      },
      step4: {
        title: "Your Information",
        fullName: "Full Name",
        emailAddress: "Email Address",
        confirmEmail: "Confirm Email",
        qrCodeSentHere: "Your QR code will be sent here",
        emailsDontMatch: "Emails don't match",
      },
      step5: {
        orderSummary: "Order Summary",
        startingAt: "starting at",
        guest: "guest",
        guests: "guests",
        dayPass: "Day Pass",
        guided: "Guided",
        attractionTickets: "Attraction Tickets",
        includesGuidedCommentary: "includes guided commentary",
        paymentDetails: "Payment Details",
        preparingPayment: "Preparing secure payment...",
        benefits: {
          unlimited: "Unlimited hop-on/hop-off until 8:00 PM",
          guaranteedSeating: "Guaranteed seating in small vehicles",
          flexible: "Flexible - use anytime during operating hours",
          qrCode: "QR code",
          qrCodes: "QR codes",
          sentViaEmail: "sent via email",
          guidedCommentary: "Guided commentary included",
        },
      },
      common: {
        back: "Back",
        continue: "Continue",
        total: "Total",
      },
    },
    
    aboutPage: {
      sendMessage: "Send Message",
      sending: "Sending...",
      messageSent: "Thank you for your message! We'll get back to you soon.",
      messageError: "Unable to send message. Please try WhatsApp or email us directly at info@hoponsintra.com",
      fullName: "Full Name",
      emailAddress: "Email Address",
    },
    
    toast: {
      newVersionAvailable: "New version available! Refresh to update.",
      contentUpdated: "Content updated!",
      loginSuccess: "🎉 You're now logged in!",
      loginError: "Login failed. Please try again.",
      settingsSaved: "Settings saved successfully to database!",
      settingsSaveFailed: "Failed to save settings to database. Saved locally only.",
      availabilitySaved: "Availability saved successfully!",
      availabilitySaveFailed: "Failed to save availability",
      contentSaved: "Content saved successfully to database!",
      contentSaveFailed: "Failed to save content. Please try again."
    }
  },
  
  pt: {
    liveChat: {
      liveSupport: "Suporte ao Vivo",
      hereToHelp: "Estamos aqui para ajudar!",
      chatOnWhatsApp: "Conversar no WhatsApp",
      orStartWebChat: "ou iniciar chat web",
      startWebChat: "Iniciar Chat Web",
      starting: "Iniciando...",
      conversationSaved: "A sua conversa está guardada.",
      welcomeMessage: "Olá! 👋 Bem-vindo ao Hop On Sintra. Como podemos ajudar?",
      enterName: "Digite o seu nome",
      enterEmail: "Digite o seu e-mail",
      enterMessage: "Digite a sua mensagem...",
      sendMessage: "Enviar",
      goBack: "Voltar"
    },
    
    userProfile: {
      myAccount: "Minha Conta",
      quickAccess: "Acesso Rápido",
      loginToProfile: "Entrar no Perfil",
      myBooking: "Minha Reserva",
      requestRide: "Solicitar Viagem",
      accessYourBooking: "Aceder à Sua Reserva",
      loginDescription: "Entre com o seu ID de reserva e apelido para aceder ao seu perfil temporário durante a sua visita.",
      bookingId: "ID da Reserva",
      bookingIdPlaceholder: "ex., AB-1234",
      lastName: "Apelido",
      lastNamePlaceholder: "ex., Silva",
      login: "Entrar",
      loggingIn: "A entrar...",
      welcomeBack: "Bem-vindo de volta",
      loggedOut: "Sessão terminada",
      pleaseEnterBoth: "Por favor, insira o ID da reserva e o apelido",
      invalidCredentials: "Credenciais de reserva inválidas",
      loginFailed: "Falha ao entrar. Por favor, tente novamente.",
      logout: "Sair",
      yourPasses: "Seus Passes",
      validFor: "Válido para"
    },
    
    requestPickupPage: {
      verifyBooking: "Verificar Sua Reserva",
      verifyBookingDescription: "Insira o seu código de reserva para solicitar uma recolha. Este serviço está disponível apenas para clientes com passes de dia ativos.",
      requestPickup: "Solicitar Recolha",
      requestPickupDescription: "Diga-nos o tamanho do seu grupo e localização, e enviaremos o veículo perfeito para si.",
      enterName: "Digite o seu nome",
      groupSize: "Tamanho do Grupo",
      pickupLocation: "Local de Recolha",
      requestingSent: "A solicitar...",
      pickupRequested: "Recolha Solicitada!",
      pickupRequestedMessage: "Recebemos o seu pedido e enviaremos um veículo em breve.",
      errorRequestingPickup: "Erro ao solicitar recolha"
    },
    
    bookingConfirmation: {
      bookingConfirmed: "Reserva Confirmada!",
      checkEmail: "Verifique o seu e-mail para confirmação e códigos QR.",
      bookingId: "ID de Reserva",
      saveForManaging: "Guarde isto para gerir a sua reserva",
      emailSentTo: "E-mail de confirmação enviado para",
      ticketsSentToEmail: "O PDF dos seus bilhetes e detalhes da reserva foram enviados para o seu e-mail.",
      bookingSummary: "Resumo da Reserva",
      booking: "Reserva",
      date: "Data",
      passengers: "Passageiros",
      person: "pessoa",
      people: "pessoas",
      totalPaid: "Total Pago",
      yourDayPassTickets: "Os Seus Bilhetes de Passe Diário",
      downloadPDF: "Descarregar PDF",
      downloading: "A descarregar...",
      printAll: "Imprimir Todos",
      pdfTicketsAttached: "PDF de Bilhetes Anexado",
      pdfTicketsAttachedDesc: "Enviámos um PDF com todos os seus bilhetes para o seu e-mail. Também pode descarregá-lo aqui ou guardar os seus bilhetes abaixo.",
      ticketsReady: "Os Seus Bilhetes Estão Prontos!",
      ticketsReadyDesc: "Mostre estes bilhetes ao condutor ao embarcar. Cada passageiro precisa do seu próprio bilhete com código QR.",
      howToUseYourPass: "Como Usar o Seu Passe",
      showQRCode: "Mostrar Código QR",
      showQRCodeDesc: "Apresente o seu código QR ao condutor ao embarcar em qualquer veículo",
      unlimitedRides: "Viagens Ilimitadas",
      unlimitedRidesDesc: "Use o seu passe para viagens ilimitadas hop-on/hop-off até às 20:00",
      regularService: "Serviço Regular",
      regularServiceDesc: "Serviço constante de todas as principais atrações durante todo o dia",
      flexibleSchedule: "Horário Flexível",
      flexibleScheduleDesc: "Passe quanto tempo quiser em cada atração",
      thankYou: "Obrigado por Escolher Hop On Sintra!",
      adventureBegins: "Estamos entusiasmados por lhe mostrar a magia de Sintra. A sua aventura começa em",
      confirmationSentTo: "A sua confirmação de reserva e bilhetes foram enviados para",
      backToHome: "Voltar à Página Inicial",
      manageBooking: "Gerir Reserva",
      viewAttractions: "Ver Atrações",
      tip: "Dica",
      tipUseBookingId: "Use o seu ID de Reserva {bookingId} para gerir a sua reserva",
      viewRouteMap: "mapa de rota interativo",
      questionsOrChanges: "Perguntas ou precisa de fazer alterações?",
      contactViaEmail: "Contacte-nos via",
      or: "ou",
      unlockFullAccess: "Desbloquear Acesso Completo",
      loginNow: "Faça login agora para aceder a funcionalidades premium durante a sua visita:",
      requestPickup: "Solicitar recolha",
      requestPickupDesc: "de qualquer atração em Sintra",
      liveChatSupport: "Suporte por chat ao vivo",
      liveChatSupportDesc: "com histórico de conversas guardado",
      viewTickets: "Ver os seus bilhetes",
      viewTicketsDesc: "e detalhes da reserva a qualquer momento",
      loginInstantly: "Use o seu {bold}ID de Reserva{/bold} e {bold}apelido{/bold} para fazer login instantaneamente.",
      loginNowButton: "Fazer Login Agora",
      youreLoggedIn: "Sessão Iniciada!",
      fullAccessEnabled: "Tem acesso total a todas as funcionalidades, incluindo solicitar recolhas e suporte por chat ao vivo. Os seus bilhetes e detalhes da reserva estão guardados no seu perfil.",
      requestPickupFrom: "Solicitar Recolha",
      downloadTickets: "Descarregar Bilhetes",
      downloadingTickets: "A descarregar...",
      noBookingFound: "Nenhuma reserva encontrada. Por favor, faça uma reserva primeiro.",
      bookNow: "Reservar Agora",
      insightTourPickup: "Tour Insight - Informação Importante de Recolha",
      departsAt: "O seu tour guiado parte às",
      meetingPoint: "Ponto de Encontro",
      arriveEarly: "Por favor, chegue 10 minutos mais cedo",
      lookForVehicle: "para garantir uma partida pontual. Procure o nosso veículo com a marca Hop On Sintra e mostre o seu bilhete ao condutor.",
      pdfDownloadSuccess: "PDF descarregado com sucesso!",
      pdfDownloadError: "Falha ao descarregar PDF"
    },
    
    buyTicketPage: {
      stepDescriptions: {
        step1: "Selecione a sua data e hora de início preferidas",
        step2: "Escolha o local de recolha e número de convidados",
      },
      progressLabels: {
        dateTime: "Data e Hora",
        pickupSpot: "Local de Recolha",
        attractions: "Atrações",
        yourDetails: "Os Seus Dados",
        confirmation: "Confirmação",
      },
      toasts: {
        paymentInitFailed: "Falha ao inicializar pagamento. Por favor, tente novamente.",
        bookingConfirmedCheckEmail: "Reserva confirmada! Verifique o seu e-mail para códigos QR.",
        bookingConfirmedQRReady: "Reserva confirmada! Códigos QR estão prontos.",
        emailVerificationWarning: "⚠️ O sistema de e-mail requer verificação de domínio. Os códigos QR estão disponíveis nesta página.",
        emailNoAddress: "⚠️ Nenhum endereço de e-mail fornecido. Guarde os seus códigos QR desta página.",
        emailErrorWithDetails: "⚠️ Não foi possível enviar o e-mail",
        emailCouldntBeSent: "Não foi possível enviar o e-mail. Guarde os seus códigos QR desta página.",
        serverConnectionIssue: "Problema de conexão ao servidor. O seu pagamento foi processado. Por favor, contacte o suporte com a sua confirmação de pagamento.",
        paymentFailed: "Pagamento falhou. Por favor, tente novamente.",
      },
      paymentError: {
        title: "Falha ao inicializar pagamento",
        message: "Não foi possível inicializar o pagamento",
        retry: "Tentar Novamente",
        goBack: "Voltar",
      },
      bookingErrors: {
        failedMultipleAttempts: "Falha ao criar reserva após múltiplas tentativas",
        failedToCreate: "Falha ao criar reserva",
        failedToComplete: "Falha ao completar reserva. Por favor, tente novamente.",
      },
      insightTourInfo: {
        title: "Tour Insight",
        description: "Alguns horários incluem o nosso Tour Insight, um passeio mais longo e detalhado onde o condutor partilha as histórias e a história por trás dos monumentos de Sintra. Procure os horários marcados com o distintivo Tour Insight abaixo.",
        badge: "Tour Insight",
      },
      soldOut: {
        title: "Temporariamente Indisponível",
        description: "Todas as datas estão atualmente esgotadas. Por favor, volte mais tarde ou contacte-nos para disponibilidade.",
        badge: "Esgotado",
      },
      step1: {
        selectDate: "Selecionar Data",
        departureTime: "Hora de Partida",
        seatsLeft: "restantes",
        note: "Nota:",
      },
      step2: {
        title: "Recolha e Tamanho do Grupo",
        description: "Escolha o seu local de recolha e número de convidados",
        total: "Total",
      },
      step3: {
        title: "Adicionar Bilhetes de Atrações?",
        skipTicketLines: "Evite as filas!",
        pricesShownFor: "Preços apresentados para",
        guests: "convidados.",
        notAvailable: "Os bilhetes de atrações ainda não estão disponíveis para compra online. Pode comprar bilhetes na entrada de cada atração.",
        each: "cada",
        tipTitle: "Dica:",
        tipDescription: "Receberá bilhetes digitais por e-mail juntamente com",
        dayPassQRCode: "o seu código QR de passe diário",
        dayPassQRCodes: "os seus códigos QR de passe diário",
        comingSoon: {
          badge: "Reserva Online em Breve",
          description: "Estamos a trabalhar para adicionar a capacidade de comprar bilhetes de atrações online. Por enquanto, os bilhetes podem ser adquiridos na entrada de cada atração.",
          tip: "💡 O seu passe diário Hop On Sintra dá-lhe transporte ilimitado para todas as atrações. Os bilhetes estão disponíveis para compra quando chegar!",
        },
      },
      step4: {
        title: "As Suas Informações",
        fullName: "Nome Completo",
        emailAddress: "Endereço de E-mail",
        confirmEmail: "Confirmar E-mail",
        qrCodeSentHere: "O seu código QR será enviado aqui",
        emailsDontMatch: "Os e-mails não correspondem",
      },
      step5: {
        orderSummary: "Resumo do Pedido",
        startingAt: "começando às",
        guest: "convidado",
        guests: "convidados",
        dayPass: "Passe Diário",
        guided: "Guiado",
        attractionTickets: "Bilhetes de Atrações",
        includesGuidedCommentary: "inclui comentários guiados",
        paymentDetails: "Detalhes do Pagamento",
        preparingPayment: "A preparar pagamento seguro...",
        benefits: {
          unlimited: "Hop-on/hop-off ilimitado até às 20:00",
          guaranteedSeating: "Lugares garantidos em veículos pequenos",
          flexible: "Flexível - use a qualquer hora durante o horário de funcionamento",
          qrCode: "Código QR",
          qrCodes: "Códigos QR",
          sentViaEmail: "enviado por e-mail",
          guidedCommentary: "Comentários guiados incluídos",
        },
      },
      common: {
        back: "Voltar",
        continue: "Continuar",
        total: "Total",
      },
    },
    
    aboutPage: {
      sendMessage: "Enviar Mensagem",
      sending: "A enviar...",
      messageSent: "Obrigado pela sua mensagem! Entraremos em contacto em breve.",
      messageError: "Não foi possível enviar a mensagem. Por favor, use WhatsApp ou envie e-mail para info@hoponsintra.com",
      fullName: "Nome Completo",
      emailAddress: "Endereço de E-mail",
    },
    
    toast: {
      newVersionAvailable: "Nova versão disponível! Atualize para atualizar.",
      contentUpdated: "Conteúdo atualizado!",
      loginSuccess: "🎉 Sessão iniciada!",
      loginError: "Falha ao entrar. Por favor, tente novamente.",
      settingsSaved: "Configurações guardadas com sucesso na base de dados!",
      settingsSaveFailed: "Falha ao guardar configurações na base de dados. Guardado localmente apenas.",
      availabilitySaved: "Disponibilidade guardada com sucesso!",
      availabilitySaveFailed: "Falha ao guardar disponibilidade",
      contentSaved: "Conteúdo guardado com sucesso na base de dados!",
      contentSaveFailed: "Falha ao guardar conteúdo. Por favor, tente novamente."
    }
  },
  
  es: {
    liveChat: {
      liveSupport: "Soporte en Vivo",
      hereToHelp: "¡Estamos aquí para ayudar!",
      chatOnWhatsApp: "Chatear en WhatsApp",
      orStartWebChat: "o iniciar chat web",
      startWebChat: "Iniciar Chat Web",
      starting: "Iniciando...",
      conversationSaved: "Tu conversación está guardada.",
      welcomeMessage: "¡Hola! 👋 Bienvenido a Hop On Sintra. ¿Cómo podemos ayudarte?",
      enterName: "Ingresa tu nombre",
      enterEmail: "Ingresa tu correo electrónico",
      enterMessage: "Escribe tu mensaje...",
      sendMessage: "Enviar",
      goBack: "Volver"
    },
    
    userProfile: {
      myAccount: "Mi Cuenta",
      quickAccess: "Acceso Rápido",
      loginToProfile: "Iniciar Sesión en Perfil",
      myBooking: "Mi Reserva",
      requestRide: "Solicitar Viaje",
      accessYourBooking: "Acceder a Tu Reserva",
      loginDescription: "Inicia sesión con tu ID de reserva y apellido para acceder a tu perfil temporal durante tu visita.",
      bookingId: "ID de Reserva",
      bookingIdPlaceholder: "ej., AB-1234",
      lastName: "Apellido",
      lastNamePlaceholder: "ej., Silva",
      login: "Iniciar Sesión",
      loggingIn: "Iniciando sesión...",
      welcomeBack: "Bienvenido de vuelta",
      loggedOut: "Has cerrado sesión",
      pleaseEnterBoth: "Por favor, ingresa el ID de reserva y el apellido",
      invalidCredentials: "Credenciales de reserva inválidas",
      loginFailed: "Fallo al iniciar sesión. Por favor, inténtalo de nuevo.",
      logout: "Cerrar Sesión",
      yourPasses: "Tus Pases",
      validFor: "Válido para"
    },
    
    requestPickupPage: {
      verifyBooking: "Verificar Tu Reserva",
      verifyBookingDescription: "Ingresa tu código de reserva para solicitar una recogida. Este servicio solo está disponible para clientes con pases de día activos.",
      requestPickup: "Solicitar Recogida",
      requestPickupDescription: "Dinos el tamaño de tu grupo y ubicación, y enviaremos el vehículo perfecto para ti.",
      enterName: "Ingresa tu nombre",
      groupSize: "Tamaño del Grupo",
      pickupLocation: "Ubicación de Recogida",
      requestingSent: "Solicitando...",
      pickupRequested: "¡Recogida Solicitada!",
      pickupRequestedMessage: "Hemos recibido tu solicitud y enviaremos un vehículo en breve.",
      errorRequestingPickup: "Error al solicitar recogida"
    },
    
    bookingConfirmation: {
      bookingConfirmed: "¡Reserva Confirmada!",
      checkEmail: "Revisa tu correo electrónico para confirmación y códigos QR.",
      bookingId: "ID de Reserva",
      saveForManaging: "Guarda esto para gestionar tu reserva",
      emailSentTo: "Correo de confirmación enviado a",
      ticketsSentToEmail: "El PDF de tus entradas y los detalles de la reserva se han enviado a tu correo electrónico.",
      bookingSummary: "Resumen de la Reserva",
      booking: "Reserva",
      date: "Fecha",
      passengers: "Pasajeros",
      person: "persona",
      people: "personas",
      totalPaid: "Total Pagado",
      yourDayPassTickets: "Tus Entradas de Pase Diario",
      downloadPDF: "Descargar PDF",
      downloading: "Descargando...",
      printAll: "Imprimir Todo",
      pdfTicketsAttached: "PDF de Entradas Adjunto",
      pdfTicketsAttachedDesc: "Hemos enviado un PDF con todas tus entradas a tu correo electrónico. También puedes descargarlo aquí o guardar tus entradas a continuación.",
      ticketsReady: "¡Tus Entradas Están Listas!",
      ticketsReadyDesc: "Muestra estas entradas al conductor al abordar. Cada pasajero necesita su propia entrada con código QR.",
      howToUseYourPass: "Cómo Usar tu Pase",
      showQRCode: "Mostrar Código QR",
      showQRCodeDesc: "Presenta tu código QR al conductor al abordar cualquier vehículo",
      unlimitedRides: "Viajes Ilimitados",
      unlimitedRidesDesc: "Usa tu pase para viajes ilimitados hop-on/hop-off hasta las 20:00",
      regularService: "Servicio Regular",
      regularServiceDesc: "Servicio constante desde todas las principales atracciones durante todo el día",
      flexibleSchedule: "Horario Flexible",
      flexibleScheduleDesc: "Pasa todo el tiempo que quieras en cada atracción",
      thankYou: "¡Gracias por Elegir Hop On Sintra!",
      adventureBegins: "Estamos emocionados por mostrarte la magia de Sintra. Tu aventura comienza el",
      confirmationSentTo: "Tu confirmación de reserva y entradas se han enviado a",
      backToHome: "Volver a la Página Principal",
      manageBooking: "Gestionar Reserva",
      viewAttractions: "Ver Atracciones",
      tip: "Consejo",
      tipUseBookingId: "Usa tu ID de Reserva {bookingId} para gestionar tu reserva",
      viewRouteMap: "mapa de ruta interactivo",
      questionsOrChanges: "¿Preguntas o necesitas hacer cambios?",
      contactViaEmail: "Contáctanos vía",
      or: "o",
      unlockFullAccess: "Desbloquear Acceso Completo",
      loginNow: "Inicia sesión ahora para acceder a funciones premium durante tu visita:",
      requestPickup: "Solicitar recogida",
      requestPickupDesc: "desde cualquier atracción en Sintra",
      liveChatSupport: "Soporte de chat en vivo",
      liveChatSupportDesc: "con historial de conversación guardado",
      viewTickets: "Ver tus entradas",
      viewTicketsDesc: "y detalles de reserva en cualquier momento",
      loginInstantly: "Usa tu {bold}ID de Reserva{/bold} y {bold}apellido{/bold} para iniciar sesión instantáneamente.",
      loginNowButton: "Iniciar Sesión Ahora",
      youreLoggedIn: "¡Has Iniciado Sesión!",
      fullAccessEnabled: "Tienes acceso completo a todas las funciones, incluida la solicitud de recogidas y el soporte de chat en vivo. Tus entradas y detalles de reserva están guardados en tu perfil.",
      requestPickupFrom: "Solicitar Recogida",
      downloadTickets: "Descargar Entradas",
      downloadingTickets: "Descargando...",
      noBookingFound: "No se encontró ninguna reserva. Por favor, haz una reserva primero.",
      bookNow: "Reservar Ahora",
      insightTourPickup: "Tour Insight - Información Importante de Recogida",
      departsAt: "Tu tour guiado sale a las",
      meetingPoint: "Punto de Encuentro",
      arriveEarly: "Por favor, llega 10 minutos antes",
      lookForVehicle: "para garantizar una salida puntual. Busca nuestro vehículo con la marca Hop On Sintra y muestra tu entrada al conductor.",
      pdfDownloadSuccess: "¡PDF descargado con éxito!",
      pdfDownloadError: "Error al descargar PDF"
    },
    
    buyTicketPage: {
      stepDescriptions: {
        step1: "Selecciona tu fecha y hora de inicio preferidas",
        step2: "Elige el lugar de recogida y número de invitados",
      },
      progressLabels: {
        dateTime: "Fecha y Hora",
        pickupSpot: "Punto de Recogida",
        attractions: "Atracciones",
        yourDetails: "Tus Datos",
        confirmation: "Confirmación",
      },
      toasts: {
        paymentInitFailed: "Error al inicializar el pago. Por favor, inténtalo de nuevo.",
        bookingConfirmedCheckEmail: "¡Reserva confirmada! Revisa tu correo para los códigos QR.",
        bookingConfirmedQRReady: "¡Reserva confirmada! Los códigos QR están listos.",
        emailVerificationWarning: "⚠️ El sistema de correo requiere verificación de dominio. Los códigos QR están disponibles en esta página.",
        emailNoAddress: "⚠️ No se proporcionó dirección de correo. Guarda tus códigos QR desde esta página.",
        emailErrorWithDetails: "⚠️ No se pudo enviar el correo",
        emailCouldntBeSent: "No se pudo enviar el correo. Guarda tus códigos QR desde esta página.",
        serverConnectionIssue: "Problema de conexión al servidor. Tu pago fue procesado. Por favor, contacta al soporte con tu confirmación de pago.",
        paymentFailed: "Pago fallido. Por favor, inténtalo de nuevo.",
      },
      paymentError: {
        title: "Error al inicializar el pago",
        message: "No se pudo inicializar el pago",
        retry: "Reintentar",
        goBack: "Volver",
      },
      bookingErrors: {
        failedMultipleAttempts: "Error al crear la reserva después de múltiples intentos",
        failedToCreate: "Error al crear la reserva",
        failedToComplete: "Error al completar la reserva. Por favor, inténtalo de nuevo.",
      },
      insightTourInfo: {
        title: "Tour Insight",
        description: "Algunos horarios incluyen nuestro Tour Insight, un recorrido más largo y detallado donde el conductor comparte las historias e historia detrás de los monumentos de Sintra. Busca los horarios marcados con la distintiva insignia de Tour Insight a continuación.",
        badge: "Tour Insight",
      },
      soldOut: {
        title: "Temporalmente No Disponible",
        description: "Todas las fechas están actualmente agotadas. Por favor, vuelve más tarde o contáctanos para disponibilidad.",
        badge: "Agotado",
      },
      step1: {
        selectDate: "Seleccionar Fecha",
        departureTime: "Hora de Salida",
        seatsLeft: "quedan",
        note: "Nota:",
      },
      step2: {
        title: "Recogida y Tamaño del Grupo",
        description: "Elige tu lugar de recogida y número de invitados",
        total: "Total",
      },
      step3: {
        title: "¿Agregar Entradas a Atracciones?",
        skipTicketLines: "¡Evita las filas!",
        pricesShownFor: "Precios mostrados para",
        guests: "invitados.",
        notAvailable: "Las entradas a atracciones aún no están disponibles para compra en línea. Puedes comprar entradas en la entrada de cada atracción.",
        each: "cada una",
        tipTitle: "Consejo:",
        tipDescription: "Recibirás entradas digitales por correo electrónico junto con",
        dayPassQRCode: "tu código QR de pase diario",
        dayPassQRCodes: "tus códigos QR de pase diario",
        comingSoon: {
          badge: "Reserva Online Próximamente",
          description: "Estamos trabajando para agregar la capacidad de comprar entradas a atracciones en línea. Por ahora, las entradas se pueden comprar en la entrada de cada atracción.",
          tip: "💡 Tu pase diario de Hop On Sintra te brinda transporte ilimitado a todas las atracciones. ¡Las entradas están disponibles para compra cuando llegues!",
        },
      },
      step4: {
        title: "Tu Información",
        fullName: "Nombre Completo",
        emailAddress: "Dirección de Correo Electrónico",
        confirmEmail: "Confirmar Correo Electrónico",
        qrCodeSentHere: "Tu código QR se enviará aquí",
        emailsDontMatch: "Los correos no coinciden",
      },
      step5: {
        orderSummary: "Resumen del Pedido",
        startingAt: "comenzando a las",
        guest: "invitado",
        guests: "invitados",
        dayPass: "Pase Diario",
        guided: "Guiado",
        attractionTickets: "Entradas a Atracciones",
        includesGuidedCommentary: "incluye comentarios guiados",
        paymentDetails: "Detalles del Pago",
        preparingPayment: "Preparando pago seguro...",
        benefits: {
          unlimited: "Hop-on/hop-off ilimitado hasta las 20:00",
          guaranteedSeating: "Asientos garantizados en vehículos pequeños",
          flexible: "Flexible - úsalo en cualquier momento durante el horario de operación",
          qrCode: "Código QR",
          qrCodes: "Códigos QR",
          sentViaEmail: "enviado por correo electrónico",
          guidedCommentary: "Comentarios guiados incluidos",
        },
      },
      common: {
        back: "Volver",
        continue: "Continuar",
        total: "Total",
      },
    },
    
    aboutPage: {
      sendMessage: "Enviar Mensaje",
      sending: "Enviando...",
      messageSent: "¡Gracias por tu mensaje! Nos pondremos en contacto pronto.",
      messageError: "No se pudo enviar el mensaje. Por favor, usa WhatsApp o envía un correo a info@hoponsintra.com",
      fullName: "Nombre Completo",
      emailAddress: "Correo Electrónico",
    },
    
    toast: {
      newVersionAvailable: "¡Nueva versión disponible! Actualiza para actualizar.",
      contentUpdated: "¡Contenido actualizado!",
      loginSuccess: "🎉 ¡Has iniciado sesión!",
      loginError: "Error al iniciar sesión. Por favor, inténtalo de nuevo.",
      settingsSaved: "¡Configuración guardada con éxito en la base de datos!",
      settingsSaveFailed: "Error al guardar la configuración en la base de datos. Guardado localmente solamente.",
      availabilitySaved: "¡Disponibilidad guardada con éxito!",
      availabilitySaveFailed: "Error al guardar disponibilidad",
      contentSaved: "¡Contenido guardado con éxito en la base de datos!",
      contentSaveFailed: "Error al guardar contenido. Por favor, inténtalo de nuevo."
    }
  },
  
  fr: {
    liveChat: {
      liveSupport: "Support en Direct",
      hereToHelp: "Nous sommes là pour vous aider!",
      chatOnWhatsApp: "Chatter sur WhatsApp",
      orStartWebChat: "ou démarrer le chat web",
      startWebChat: "Démarrer le Chat Web",
      starting: "Démarrage...",
      conversationSaved: "Votre conversation est sauvegardée.",
      welcomeMessage: "Salut! 👋 Bienvenue chez Hop On Sintra. Comment pouvons-nous vous aider?",
      enterName: "Entrez votre nom",
      enterEmail: "Entrez votre e-mail",
      enterMessage: "Tapez votre message...",
      sendMessage: "Envoyer",
      goBack: "Retour"
    },
    
    userProfile: {
      myAccount: "Mon Compte",
      quickAccess: "Accès Rapide",
      loginToProfile: "Se Connecter au Profil",
      myBooking: "Ma Réservation",
      requestRide: "Demander un Trajet",
      accessYourBooking: "Accéder à Votre Réservation",
      loginDescription: "Connectez-vous avec votre ID de réservation et votre nom de famille pour accéder à votre profil temporaire pendant votre visite.",
      bookingId: "ID de Réservation",
      bookingIdPlaceholder: "ex., AB-1234",
      lastName: "Nom de Famille",
      lastNamePlaceholder: "ex., Silva",
      login: "Se Connecter",
      loggingIn: "Connexion...",
      welcomeBack: "Bon retour",
      loggedOut: "Vous êtes déconnecté",
      pleaseEnterBoth: "Veuillez entrer l'ID de réservation et le nom de famille",
      invalidCredentials: "Identifiants de réservation invalides",
      loginFailed: "Échec de la connexion. Veuillez réessayer.",
      logout: "Déconnexion",
      yourPasses: "Vos Pass",
      validFor: "Valable pour"
    },
    
    requestPickupPage: {
      verifyBooking: "Vérifier Votre Réservation",
      verifyBookingDescription: "Entrez votre code de réservation pour demander un ramassage. Ce service n'est disponible que pour les clients avec des pass journaliers actifs.",
      requestPickup: "Demander un Ramassage",
      requestPickupDescription: "Dites-nous la taille de votre groupe et votre emplacement, et nous enverrons le véhicule parfait pour vous.",
      enterName: "Entrez votre nom",
      groupSize: "Taille du Groupe",
      pickupLocation: "Lieu de Ramassage",
      requestingSent: "Demande en cours...",
      pickupRequested: "Ramassage Demandé!",
      pickupRequestedMessage: "Nous avons reçu votre demande et enverrons un véhicule sous peu.",
      errorRequestingPickup: "Erreur lors de la demande de ramassage"
    },
    
    bookingConfirmation: {
      bookingConfirmed: "Réservation Confirmée!",
      checkEmail: "Vérifiez votre e-mail pour la confirmation et les codes QR.",
      bookingId: "ID de Réservation",
      saveForManaging: "Gardez ceci pour gérer votre réservation",
      emailSentTo: "E-mail de confirmation envoyé à",
      ticketsSentToEmail: "Le PDF de vos billets et les détails de la réservation ont été envoyés à votre e-mail.",
      bookingSummary: "Récapitulatif de la Réservation",
      booking: "Réservation",
      date: "Date",
      passengers: "Passagers",
      person: "personne",
      people: "personnes",
      totalPaid: "Total Payé",
      yourDayPassTickets: "Vos Billets de Pass Journalier",
      downloadPDF: "Télécharger PDF",
      downloading: "Téléchargement...",
      printAll: "Tout Imprimer",
      pdfTicketsAttached: "PDF de Billets Joint",
      pdfTicketsAttachedDesc: "Nous avons envoyé un PDF avec tous vos billets à votre e-mail. Vous pouvez également le télécharger ici ou enregistrer vos billets ci-dessous.",
      ticketsReady: "Vos Billets Sont Prêts!",
      ticketsReadyDesc: "Montrez ces billets au conducteur lors de l'embarquement. Chaque passager a besoin de son propre billet avec code QR.",
      howToUseYourPass: "Comment Utiliser Votre Pass",
      showQRCode: "Afficher le Code QR",
      showQRCodeDesc: "Présentez votre code QR au conducteur lors de l'embarquement dans n'importe quel véhicule",
      unlimitedRides: "Trajets Illimités",
      unlimitedRidesDesc: "Utilisez votre pass pour des trajets illimités hop-on/hop-off jusqu'à 20h00",
      regularService: "Service Régulier",
      regularServiceDesc: "Service continu depuis toutes les principales attractions tout au long de la journée",
      flexibleSchedule: "Horaire Flexible",
      flexibleScheduleDesc: "Passez autant de temps que vous le souhaitez à chaque attraction",
      thankYou: "Merci d'Avoir Choisi Hop On Sintra!",
      adventureBegins: "Nous sommes ravis de vous montrer la magie de Sintra. Votre aventure commence le",
      confirmationSentTo: "Votre confirmation de réservation et vos billets ont été envoyés à",
      backToHome: "Retour à l'Accueil",
      manageBooking: "Gérer la Réservation",
      viewAttractions: "Voir les Attractions",
      tip: "Conseil",
      tipUseBookingId: "Utilisez votre ID de Réservation {bookingId} pour gérer votre réservation",
      viewRouteMap: "carte de l'itinéraire interactive",
      questionsOrChanges: "Des questions ou besoin de modifications?",
      contactViaEmail: "Contactez-nous via",
      or: "ou",
      unlockFullAccess: "Débloquer l'Accès Complet",
      loginNow: "Connectez-vous maintenant pour accéder aux fonctionnalités premium pendant votre visite:",
      requestPickup: "Demander un ramassage",
      requestPickupDesc: "depuis n'importe quelle attraction à Sintra",
      liveChatSupport: "Support par chat en direct",
      liveChatSupportDesc: "avec l'historique des conversations enregistré",
      viewTickets: "Voir vos billets",
      viewTicketsDesc: "et les détails de réservation à tout moment",
      loginInstantly: "Utilisez votre {bold}ID de Réservation{/bold} et {bold}nom de famille{/bold} pour vous connecter instantanément.",
      loginNowButton: "Se Connecter Maintenant",
      youreLoggedIn: "Vous êtes Connecté!",
      fullAccessEnabled: "Vous avez un accès complet à toutes les fonctionnalités, y compris la demande de ramassage et le support par chat en direct. Vos billets et détails de réservation sont enregistrés dans votre profil.",
      requestPickupFrom: "Demander un Ramassage",
      downloadTickets: "Télécharger les Billets",
      downloadingTickets: "Téléchargement...",
      noBookingFound: "Aucune réservation trouvée. Veuillez d'abord effectuer une réservation.",
      bookNow: "Réserver Maintenant",
      insightTourPickup: "Tour Insight - Informations Importantes sur le Ramassage",
      departsAt: "Votre visite guidée part à",
      meetingPoint: "Point de Rendez-vous",
      arriveEarly: "Veuillez arriver 10 minutes à l'avance",
      lookForVehicle: "pour garantir un départ ponctuel. Cherchez notre véhicule avec la marque Hop On Sintra et montrez votre billet au conducteur.",
      pdfDownloadSuccess: "PDF téléchargé avec succès!",
      pdfDownloadError: "Échec du téléchargement du PDF"
    },
    
    buyTicketPage: {
      stepDescriptions: {
        step1: "Sélectionnez votre date et heure de début préférées",
        step2: "Choisissez le lieu de ramassage et le nombre d'invités",
      },
      progressLabels: {
        dateTime: "Date et Heure",
        pickupSpot: "Lieu de Ramassage",
        attractions: "Attractions",
        yourDetails: "Vos Détails",
        confirmation: "Confirmation",
      },
      toasts: {
        paymentInitFailed: "Échec de l'initialisation du paiement. Veuillez réessayer.",
        bookingConfirmedCheckEmail: "Réservation confirmée! Vérifiez votre e-mail pour les codes QR.",
        bookingConfirmedQRReady: "Réservation confirmée! Les codes QR sont prêts.",
        emailVerificationWarning: "⚠️ Le système d'e-mail nécessite une vérification de domaine. Les codes QR sont disponibles sur cette page.",
        emailNoAddress: "⚠️ Aucune adresse e-mail fournie. Enregistrez vos codes QR depuis cette page.",
        emailErrorWithDetails: "⚠️ Impossible d'envoyer l'e-mail",
        emailCouldntBeSent: "Impossible d'envoyer l'e-mail. Enregistrez vos codes QR depuis cette page.",
        serverConnectionIssue: "Problème de connexion au serveur. Votre paiement a été traité. Veuillez contacter le support avec votre confirmation de paiement.",
        paymentFailed: "Échec du paiement. Veuillez réessayer.",
      },
      paymentError: {
        title: "Échec de l'initialisation du paiement",
        message: "Impossible d'initialiser le paiement",
        retry: "Réessayer",
        goBack: "Retour",
      },
      bookingErrors: {
        failedMultipleAttempts: "Échec de création de la réservation après plusieurs tentatives",
        failedToCreate: "Échec de création de la réservation",
        failedToComplete: "Échec de finalisation de la réservation. Veuillez réessayer.",
      },
      insightTourInfo: {
        title: "Tour Insight",
        description: "Certains créneaux horaires incluent notre Tour Insight, un trajet plus long et détaillé où le chauffeur partage les histoires et l'histoire derrière les monuments de Sintra. Recherchez les créneaux horaires marqués avec le badge distinctif Tour Insight ci-dessous.",
        badge: "Tour Insight",
      },
      soldOut: {
        title: "Temporairement Indisponible",
        description: "Toutes les dates sont actuellement complètes. Veuillez revenir plus tard ou nous contacter pour la disponibilité.",
        badge: "Complet",
      },
      step1: {
        selectDate: "Sélectionner la Date",
        departureTime: "Heure de Départ",
        seatsLeft: "restantes",
        note: "Note:",
      },
      step2: {
        title: "Lieu de Ramassage et Taille du Groupe",
        description: "Choisissez votre lieu de ramassage et le nombre d'invités",
        total: "Total",
      },
      step3: {
        title: "Ajouter des Billets d'Attraction?",
        skipTicketLines: "Évitez les files d'attente!",
        pricesShownFor: "Prix affichés pour",
        guests: "invités.",
        notAvailable: "Les billets d'attraction ne sont pas encore disponibles pour l'achat en ligne. Vous pouvez acheter des billets à l'entrée de chaque attraction.",
        each: "chacun",
        tipTitle: "Astuce:",
        tipDescription: "Vous recevrez des billets numériques par e-mail avec",
        dayPassQRCode: "votre code QR de pass journalier",
        dayPassQRCodes: "vos codes QR de pass journalier",
        comingSoon: {
          badge: "Réservation en Ligne Bientôt",
          description: "Nous travaillons à ajouter la possibilité d'acheter des billets d'attraction en ligne. Pour l'instant, les billets peuvent être achetés à l'entrée de chaque attraction.",
          tip: "💡 Votre pass journalier Hop On Sintra vous donne un transport illimité vers toutes les attractions. Les billets sont disponibles à l'achat à votre arrivée!",
        },
      },
      step4: {
        title: "Vos Informations",
        fullName: "Nom Complet",
        emailAddress: "Adresse E-mail",
        confirmEmail: "Confirmer l'E-mail",
        qrCodeSentHere: "Votre code QR sera envoyé ici",
        emailsDontMatch: "Les e-mails ne correspondent pas",
      },
      step5: {
        orderSummary: "Récapitulatif de la Commande",
        startingAt: "commençant à",
        guest: "invité",
        guests: "invités",
        dayPass: "Pass Journalier",
        guided: "Guidé",
        attractionTickets: "Billets d'Attraction",
        includesGuidedCommentary: "inclut des commentaires guidés",
        paymentDetails: "Détails du Paiement",
        preparingPayment: "Préparation du paiement sécurisé...",
        benefits: {
          unlimited: "Hop-on/hop-off illimité jusqu'à 20h00",
          guaranteedSeating: "Sièges garantis dans de petits véhicules",
          flexible: "Flexible - à utiliser à tout moment pendant les heures d'ouverture",
          qrCode: "Code QR",
          qrCodes: "Codes QR",
          sentViaEmail: "envoyé par e-mail",
          guidedCommentary: "Commentaires guidés inclus",
        },
      },
      common: {
        back: "Retour",
        continue: "Continuer",
        total: "Total",
      },
    },
    
    aboutPage: {
      sendMessage: "Envoyer le Message",
      sending: "Envoi...",
      messageSent: "Merci pour votre message! Nous vous recontacterons bientôt.",
      messageError: "Impossible d'envoyer le message. Veuillez utiliser WhatsApp ou nous envoyer un e-mail à info@hoponsintra.com",
      fullName: "Nom Complet",
      emailAddress: "Adresse E-mail",
    },
    
    toast: {
      newVersionAvailable: "Nouvelle version disponible! Actualisez pour mettre à jour.",
      contentUpdated: "Contenu mis à jour!",
      loginSuccess: "🎉 Vous êtes maintenant connecté!",
      loginError: "Échec de la connexion. Veuillez réessayer.",
      settingsSaved: "Paramètres enregistrés avec succès dans la base de données!",
      settingsSaveFailed: "Échec de l'enregistrement des paramètres dans la base de données. Enregistré localement uniquement.",
      availabilitySaved: "Disponibilité enregistrée avec succès!",
      availabilitySaveFailed: "Échec de l'enregistrement de la disponibilité",
      contentSaved: "Contenu enregistré avec succès dans la base de données!",
      contentSaveFailed: "Échec de l'enregistrement du contenu. Veuillez réessayer."
    }
  },
  
  de: {
    liveChat: {
      liveSupport: "Live-Support",
      hereToHelp: "Wir sind hier, um zu helfen!",
      chatOnWhatsApp: "Auf WhatsApp chatten",
      orStartWebChat: "oder Web-Chat starten",
      startWebChat: "Web-Chat Starten",
      starting: "Wird gestartet...",
      conversationSaved: "Ihr Gespräch ist gespeichert.",
      welcomeMessage: "Hallo! 👋 Willkommen bei Hop On Sintra. Wie können wir Ihnen helfen?",
      enterName: "Geben Sie Ihren Namen ein",
      enterEmail: "Geben Sie Ihre E-Mail ein",
      enterMessage: "Geben Sie Ihre Nachricht ein...",
      sendMessage: "Senden",
      goBack: "Zurück"
    },
    
    userProfile: {
      myAccount: "Mein Konto",
      quickAccess: "Schnellzugriff",
      loginToProfile: "Zum Profil Anmelden",
      myBooking: "Meine Buchung",
      requestRide: "Fahrt Anfordern",
      accessYourBooking: "Auf Ihre Buchung Zugreifen",
      loginDescription: "Melden Sie sich mit Ihrer Buchungs-ID und Ihrem Nachnamen an, um während Ihres Besuchs auf Ihr temporäres Profil zuzugreifen.",
      bookingId: "Buchungs-ID",
      bookingIdPlaceholder: "z.B., AB-1234",
      lastName: "Nachname",
      lastNamePlaceholder: "z.B., Silva",
      login: "Anmelden",
      loggingIn: "Anmeldung...",
      welcomeBack: "Willkommen zurück",
      loggedOut: "Sie wurden abgemeldet",
      pleaseEnterBoth: "Bitte geben Sie Buchungs-ID und Nachname ein",
      invalidCredentials: "Ungültige Buchungsangaben",
      loginFailed: "Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.",
      logout: "Abmelden",
      yourPasses: "Ihre Pässe",
      validFor: "Gültig für"
    },
    
    requestPickupPage: {
      verifyBooking: "Überprüfen Sie Ihre Buchung",
      verifyBookingDescription: "Geben Sie Ihren Buchungscode ein, um eine Abholung anzufordern. Dieser Service ist nur für Kunden mit aktiven Tagespässen verfügbar.",
      requestPickup: "Abholung Anfordern",
      requestPickupDescription: "Teilen Sie uns Ihre Gruppengröße und Ihren Standort mit, und wir schicken das perfekte Fahrzeug für Sie.",
      enterName: "Geben Sie Ihren Namen ein",
      groupSize: "Gruppengröße",
      pickupLocation: "Abholort",
      requestingSent: "Wird angefordert...",
      pickupRequested: "Abholung Angefordert!",
      pickupRequestedMessage: "Wir haben Ihre Anfrage erhalten und werden in Kürze ein Fahrzeug schicken.",
      errorRequestingPickup: "Fehler beim Anfordern der Abholung"
    },
    
    bookingConfirmation: {
      bookingConfirmed: "Buchung Bestätigt!",
      checkEmail: "Überprüfen Sie Ihre E-Mail für die Bestätigung und QR-Codes.",
      bookingId: "Buchungs-ID",
      saveForManaging: "Bewahren Sie dies auf, um Ihre Buchung zu verwalten",
      emailSentTo: "Bestätigungs-E-Mail gesendet an",
      ticketsSentToEmail: "Ihr Ticket-PDF und die Buchungsdetails wurden an Ihre E-Mail gesendet.",
      bookingSummary: "Buchungszusammenfassung",
      booking: "Buchung",
      date: "Datum",
      passengers: "Passagiere",
      person: "Person",
      people: "Personen",
      totalPaid: "Gesamtbetrag",
      yourDayPassTickets: "Ihre Tagespass-Tickets",
      downloadPDF: "PDF Herunterladen",
      downloading: "Wird heruntergeladen...",
      printAll: "Alles Drucken",
      pdfTicketsAttached: "PDF-Tickets Angehängt",
      pdfTicketsAttachedDesc: "Wir haben ein PDF mit allen Ihren Tickets an Ihre E-Mail gesendet. Sie können es auch hier herunterladen oder Ihre Tickets unten speichern.",
      ticketsReady: "Ihre Tickets Sind Bereit!",
      ticketsReadyDesc: "Zeigen Sie diese Tickets beim Einsteigen dem Fahrer. Jeder Passagier benötigt sein eigenes Ticket mit QR-Code.",
      howToUseYourPass: "So Verwenden Sie Ihren Pass",
      showQRCode: "QR-Code Anzeigen",
      showQRCodeDesc: "Zeigen Sie Ihren QR-Code dem Fahrer beim Einsteigen in ein Fahrzeug",
      unlimitedRides: "Unbegrenzte Fahrten",
      unlimitedRidesDesc: "Nutzen Sie Ihren Pass für unbegrenzte Hop-on/Hop-off-Fahrten bis 20:00 Uhr",
      regularService: "Regelmäßiger Service",
      regularServiceDesc: "Zuverlässiger Service von allen Hauptattraktionen den ganzen Tag",
      flexibleSchedule: "Flexibler Zeitplan",
      flexibleScheduleDesc: "Verbringen Sie so viel Zeit wie Sie möchten an jeder Attraktion",
      thankYou: "Vielen Dank, dass Sie Hop On Sintra Gewählt Haben!",
      adventureBegins: "Wir freuen uns, Ihnen die Magie von Sintra zu zeigen. Ihr Abenteuer beginnt am",
      confirmationSentTo: "Ihre Buchungsbestätigung und Tickets wurden gesendet an",
      backToHome: "Zurück zur Startseite",
      manageBooking: "Buchung Verwalten",
      viewAttractions: "Attraktionen Ansehen",
      tip: "Tipp",
      tipUseBookingId: "Verwenden Sie Ihre Buchungs-ID {bookingId}, um Ihre Reservierung zu verwalten",
      viewRouteMap: "interaktive Routenkarte",
      questionsOrChanges: "Fragen oder Änderungen erforderlich?",
      contactViaEmail: "Kontaktieren Sie uns per",
      or: "oder",
      unlockFullAccess: "Vollzugriff Freischalten",
      loginNow: "Melden Sie sich jetzt an, um während Ihres Besuchs auf Premium-Funktionen zuzugreifen:",
      requestPickup: "Abholung anfordern",
      requestPickupDesc: "von jeder Attraktion in Sintra",
      liveChatSupport: "Live-Chat-Support",
      liveChatSupportDesc: "mit gespeichertem Gesprächsverlauf",
      viewTickets: "Ihre Tickets ansehen",
      viewTicketsDesc: "und Buchungsdetails jederzeit",
      loginInstantly: "Verwenden Sie Ihre {bold}Buchungs-ID{/bold} und {bold}Nachname{/bold}, um sich sofort anzumelden.",
      loginNowButton: "Jetzt Anmelden",
      youreLoggedIn: "Sie Sind Angemeldet!",
      fullAccessEnabled: "Sie haben vollen Zugriff auf alle Funktionen, einschließlich Abholanfragen und Live-Chat-Support. Ihre Tickets und Buchungsdetails sind in Ihrem Profil gespeichert.",
      requestPickupFrom: "Abholung Anfordern",
      downloadTickets: "Tickets Herunterladen",
      downloadingTickets: "Wird heruntergeladen...",
      noBookingFound: "Keine Buchung gefunden. Bitte tätigen Sie zuerst eine Buchung.",
      bookNow: "Jetzt Buchen",
      insightTourPickup: "Insight Tour - Wichtige Abholinformationen",
      departsAt: "Ihre geführte Tour startet um",
      meetingPoint: "Treffpunkt",
      arriveEarly: "Bitte kommen Sie 10 Minuten früher",
      lookForVehicle: "um eine pünktliche Abfahrt zu gewährleisten. Suchen Sie nach unserem Fahrzeug mit dem Hop On Sintra-Branding und zeigen Sie Ihr Ticket dem Fahrer.",
      pdfDownloadSuccess: "PDF erfolgreich heruntergeladen!",
      pdfDownloadError: "PDF-Download fehlgeschlagen"
    },
    
    buyTicketPage: {
      stepDescriptions: {
        step1: "Wählen Sie Ihr bevorzugtes Datum und Ihre Startzeit",
        step2: "Wählen Sie den Abholort und die Anzahl der Gäste",
      },
      progressLabels: {
        dateTime: "Datum & Uhrzeit",
        pickupSpot: "Abholort",
        attractions: "Attraktionen",
        yourDetails: "Ihre Daten",
        confirmation: "Bestätigung",
      },
      toasts: {
        paymentInitFailed: "Fehler bei der Zahlungsinitialisierung. Bitte versuchen Sie es erneut.",
        bookingConfirmedCheckEmail: "Buchung bestätigt! Überprüfen Sie Ihre E-Mail für QR-Codes.",
        bookingConfirmedQRReady: "Buchung bestätigt! QR-Codes sind bereit.",
        emailVerificationWarning: "⚠️ Das E-Mail-System erfordert eine Domain-Verifizierung. QR-Codes sind auf dieser Seite verfügbar.",
        emailNoAddress: "⚠️ Keine E-Mail-Adresse angegeben. Speichern Sie Ihre QR-Codes von dieser Seite.",
        emailErrorWithDetails: "⚠️ E-Mail konnte nicht gesendet werden",
        emailCouldntBeSent: "E-Mail konnte nicht gesendet werden. Speichern Sie Ihre QR-Codes von dieser Seite.",
        serverConnectionIssue: "Server-Verbindungsproblem. Ihre Zahlung wurde verarbeitet. Bitte kontaktieren Sie den Support mit Ihrer Zahlungsbestätigung.",
        paymentFailed: "Zahlung fehlgeschlagen. Bitte versuchen Sie es erneut.",
      },
      paymentError: {
        title: "Zahlungsinitialisierung fehlgeschlagen",
        message: "Zahlung konnte nicht initialisiert werden",
        retry: "Erneut versuchen",
        goBack: "Zurück",
      },
      bookingErrors: {
        failedMultipleAttempts: "Buchungserstellung nach mehreren Versuchen fehlgeschlagen",
        failedToCreate: "Buchungserstellung fehlgeschlagen",
        failedToComplete: "Buchungsabschluss fehlgeschlagen. Bitte versuchen Sie es erneut.",
      },
      insightTourInfo: {
        title: "Insight Tour",
        description: "Ausgewählte Zeitfenster umfassen unsere Insight Tour, eine längere und detailliertere Fahrt, bei der der Fahrer die Geschichten und Geschichte hinter Sintras Monumenten teilt. Suchen Sie nach Zeitfenstern, die mit dem charakteristischen Insight Tour-Badge unten markiert sind.",
        badge: "Insight Tour",
      },
      soldOut: {
        title: "Vorübergehend Nicht Verfügbar",
        description: "Alle Termine sind derzeit ausgebucht. Bitte schauen Sie später wieder vorbei oder kontaktieren Sie uns für Verfügbarkeit.",
        badge: "Ausverkauft",
      },
      step1: {
        selectDate: "Datum Auswählen",
        departureTime: "Abfahrtszeit",
        seatsLeft: "übrig",
        note: "Hinweis:",
      },
      step2: {
        title: "Abholung & Gruppengröße",
        description: "Wählen Sie Ihren Abholort und die Anzahl der Gäste",
        total: "Gesamt",
      },
      step3: {
        title: "Attraktionstickets Hinzufügen?",
        skipTicketLines: "Überspringen Sie die Warteschlangen!",
        pricesShownFor: "Preise angezeigt für",
        guests: "Gäste.",
        notAvailable: "Attraktionstickets sind noch nicht online verfügbar. Sie können Tickets am Eingang jeder Attraktion kaufen.",
        each: "jeweils",
        tipTitle: "Tipp:",
        tipDescription: "Sie erhalten digitale Tickets per E-Mail zusammen mit",
        dayPassQRCode: "Ihrem Tagespass-QR-Code",
        dayPassQRCodes: "Ihren Tagespass-QR-Codes",
        comingSoon: {
          badge: "Online-Buchung Bald Verfügbar",
          description: "Wir arbeiten daran, die Möglichkeit zum Online-Kauf von Attraktionstickets hinzuzufügen. Vorerst können Tickets am Eingang jeder Attraktion gekauft werden.",
          tip: "💡 Ihr Hop On Sintra Tagespass bietet Ihnen unbegrenzten Transport zu allen Attraktionen. Tickets sind beim Eintreffen erhältlich!",
        },
      },
      step4: {
        title: "Ihre Informationen",
        fullName: "Vollständiger Name",
        emailAddress: "E-Mail-Adresse",
        confirmEmail: "E-Mail Bestätigen",
        qrCodeSentHere: "Ihr QR-Code wird hierhin gesendet",
        emailsDontMatch: "E-Mails stimmen nicht überein",
      },
      step5: {
        orderSummary: "Bestellübersicht",
        startingAt: "beginnend um",
        guest: "Gast",
        guests: "Gäste",
        dayPass: "Tagespass",
        guided: "Geführt",
        attractionTickets: "Attraktionstickets",
        includesGuidedCommentary: "beinhaltet geführte Kommentare",
        paymentDetails: "Zahlungsdetails",
        preparingPayment: "Sichere Zahlung wird vorbereitet...",
        benefits: {
          unlimited: "Unbegrenztes Hop-on/Hop-off bis 20:00 Uhr",
          guaranteedSeating: "Garantierte Sitzplätze in kleinen Fahrzeugen",
          flexible: "Flexibel - jederzeit während der Betriebszeiten nutzbar",
          qrCode: "QR-Code",
          qrCodes: "QR-Codes",
          sentViaEmail: "per E-Mail gesendet",
          guidedCommentary: "Geführte Kommentare inklusive",
        },
      },
      common: {
        back: "Zurück",
        continue: "Weiter",
        total: "Gesamt",
      },
    },
    
    aboutPage: {
      sendMessage: "Nachricht Senden",
      sending: "Wird gesendet...",
      messageSent: "Vielen Dank für Ihre Nachricht! Wir werden uns bald bei Ihnen melden.",
      messageError: "Nachricht konnte nicht gesendet werden. Bitte verwenden Sie WhatsApp oder senden Sie uns eine E-Mail an info@hoponsintra.com",
      fullName: "Vollständiger Name",
      emailAddress: "E-Mail-Adresse",
    },
    
    toast: {
      newVersionAvailable: "Neue Version verfügbar! Aktualisieren Sie, um zu aktualisieren.",
      contentUpdated: "Inhalt aktualisiert!",
      loginSuccess: "🎉 Sie sind jetzt angemeldet!",
      loginError: "Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.",
      settingsSaved: "Einstellungen erfolgreich in der Datenbank gespeichert!",
      settingsSaveFailed: "Fehler beim Speichern der Einstellungen in der Datenbank. Nur lokal gespeichert.",
      availabilitySaved: "Verfügbarkeit erfolgreich gespeichert!",
      availabilitySaveFailed: "Fehler beim Speichern der Verfügbarkeit",
      contentSaved: "Inhalt erfolgreich in der Datenbank gespeichert!",
      contentSaveFailed: "Fehler beim Speichern des Inhalts. Bitte versuchen Sie es erneut."
    }
  },
  
  nl: {
    liveChat: {
      liveSupport: "Live Ondersteuning",
      hereToHelp: "We zijn hier om te helpen!",
      chatOnWhatsApp: "Chatten op WhatsApp",
      orStartWebChat: "of start webchat",
      startWebChat: "Webchat Starten",
      starting: "Starten...",
      conversationSaved: "Uw gesprek is opgeslagen.",
      welcomeMessage: "Hallo! 👋 Welkom bij Hop On Sintra. Hoe kunnen we u helpen?",
      enterName: "Voer uw naam in",
      enterEmail: "Voer uw e-mail in",
      enterMessage: "Typ uw bericht...",
      sendMessage: "Verzenden",
      goBack: "Terug"
    },
    
    userProfile: {
      myAccount: "Mijn Account",
      quickAccess: "Snelle Toegang",
      loginToProfile: "Inloggen op Profiel",
      myBooking: "Mijn Boeking",
      requestRide: "Rit Aanvragen",
      accessYourBooking: "Toegang tot Uw Boeking",
      loginDescription: "Log in met uw boekings-ID en achternaam om toegang te krijgen tot uw tijdelijke profiel tijdens uw bezoek.",
      bookingId: "Boekings-ID",
      bookingIdPlaceholder: "bijv., AB-1234",
      lastName: "Achternaam",
      lastNamePlaceholder: "bijv., Silva",
      login: "Inloggen",
      loggingIn: "Inloggen...",
      welcomeBack: "Welkom terug",
      loggedOut: "U bent uitgelogd",
      pleaseEnterBoth: "Voer zowel boekings-ID als achternaam in",
      invalidCredentials: "Ongeldige boekingsgegevens",
      loginFailed: "Inloggen mislukt. Probeer het opnieuw.",
      logout: "Uitloggen",
      yourPasses: "Uw Passen",
      validFor: "Geldig voor"
    },
    
    requestPickupPage: {
      verifyBooking: "Verifieer Uw Boeking",
      verifyBookingDescription: "Voer uw boekingscode in om een ophaalverzoek te doen. Deze service is alleen beschikbaar voor klanten met actieve dagpassen.",
      requestPickup: "Ophalen Aanvragen",
      requestPickupDescription: "Vertel ons uw groepsgrootte en locatie, en we sturen het perfecte voertuig voor u.",
      enterName: "Voer uw naam in",
      groupSize: "Groepsgrootte",
      pickupLocation: "Ophaallocatie",
      requestingSent: "Aanvragen...",
      pickupRequested: "Ophalen Aangevraagd!",
      pickupRequestedMessage: "We hebben uw verzoek ontvangen en sturen binnenkort een voertuig.",
      errorRequestingPickup: "Fout bij aanvragen van ophalen"
    },
    
    bookingConfirmation: {
      bookingConfirmed: "Boeking Bevestigd!",
      checkEmail: "Controleer uw e-mail voor bevestiging en QR-codes.",
      bookingId: "Boekings-ID",
      saveForManaging: "Bewaar dit voor het beheren van uw boeking",
      emailSentTo: "Bevestigingse-mail verzonden naar",
      ticketsSentToEmail: "Uw tickets-PDF en boekingsgegevens zijn naar uw e-mail verzonden.",
      bookingSummary: "Boekingsoverzicht",
      booking: "Boeking",
      date: "Datum",
      passengers: "Passagiers",
      person: "persoon",
      people: "personen",
      totalPaid: "Totaal Betaald",
      yourDayPassTickets: "Uw Dagpas Tickets",
      downloadPDF: "Download PDF",
      downloading: "Downloaden...",
      printAll: "Alles Afdrukken",
      pdfTicketsAttached: "PDF-Tickets Bijgevoegd",
      pdfTicketsAttachedDesc: "We hebben een PDF met al uw tickets naar uw e-mail gestuurd. U kunt het ook hier downloaden of uw tickets hieronder opslaan.",
      ticketsReady: "Uw Tickets Zijn Klaar!",
      ticketsReadyDesc: "Toon deze tickets aan de chauffeur bij het instappen. Elke passagier heeft zijn eigen ticket met QR-code nodig.",
      howToUseYourPass: "Hoe U Uw Pas Gebruikt",
      showQRCode: "Toon QR-Code",
      showQRCodeDesc: "Toon uw QR-code aan de chauffeur bij het instappen in een voertuig",
      unlimitedRides: "Onbeperkte Ritten",
      unlimitedRidesDesc: "Gebruik uw pas voor onbeperkte hop-on/hop-off ritten tot 20:00 uur",
      regularService: "Regelmatige Service",
      regularServiceDesc: "Doorlopende service van alle belangrijke attracties gedurende de hele dag",
      flexibleSchedule: "Flexibel Schema",
      flexibleScheduleDesc: "Besteed zoveel tijd als u wilt bij elke attractie",
      thankYou: "Bedankt voor het Kiezen van Hop On Sintra!",
      adventureBegins: "We zijn enthousiast om u de magie van Sintra te laten zien. Uw avontuur begint op",
      confirmationSentTo: "Uw boekingsbevestiging en tickets zijn verzonden naar",
      backToHome: "Terug naar Homepage",
      manageBooking: "Boeking Beheren",
      viewAttractions: "Attracties Bekijken",
      tip: "Tip",
      tipUseBookingId: "Gebruik uw Boekings-ID {bookingId} om uw reservering te beheren",
      viewRouteMap: "interactieve routekaart",
      questionsOrChanges: "Vragen of wijzigingen nodig?",
      contactViaEmail: "Neem contact met ons op via",
      or: "of",
      unlockFullAccess: "Volledige Toegang Ontgrendelen",
      loginNow: "Log nu in om toegang te krijgen tot premiumfuncties tijdens uw bezoek:",
      requestPickup: "Ophalen aanvragen",
      requestPickupDesc: "vanaf elke attractie in Sintra",
      liveChatSupport: "Live chat ondersteuning",
      liveChatSupportDesc: "met opgeslagen gespreksgeschiedenis",
      viewTickets: "Bekijk uw tickets",
      viewTicketsDesc: "en boekingsdetails op elk moment",
      loginInstantly: "Gebruik uw {bold}Boekings-ID{/bold} en {bold}achternaam{/bold} om direct in te loggen.",
      loginNowButton: "Nu Inloggen",
      youreLoggedIn: "U bent Ingelogd!",
      fullAccessEnabled: "U heeft volledige toegang tot alle functies, inclusief het aanvragen van ophaalservice en live chat ondersteuning. Uw tickets en boekingsgegevens zijn opgeslagen in uw profiel.",
      requestPickupFrom: "Ophalen Aanvragen",
      downloadTickets: "Tickets Downloaden",
      downloadingTickets: "Downloaden...",
      noBookingFound: "Geen boeking gevonden. Maak eerst een boeking.",
      bookNow: "Nu Boeken",
      insightTourPickup: "Insight Tour - Belangrijke Ophaalinformatie",
      departsAt: "Uw begeleide tour vertrekt om",
      meetingPoint: "Ontmoetingspunt",
      arriveEarly: "Kom alstublieft 10 minuten eerder",
      lookForVehicle: "om een stipt vertrek te garanderen. Zoek naar ons voertuig met het Hop On Sintra-merk en toon uw ticket aan de chauffeur.",
      pdfDownloadSuccess: "PDF succesvol gedownload!",
      pdfDownloadError: "PDF-download mislukt"
    },
    
    buyTicketPage: {
      stepDescriptions: {
        step1: "Selecteer uw voorkeursdatum en starttijd",
        step2: "Kies de ophaallocatie en aantal gasten",
      },
      progressLabels: {
        dateTime: "Datum & Tijd",
        pickupSpot: "Ophaallocatie",
        attractions: "Attracties",
        yourDetails: "Uw Gegevens",
        confirmation: "Bevestiging",
      },
      toasts: {
        paymentInitFailed: "Betaling initialiseren mislukt. Probeer het opnieuw.",
        bookingConfirmedCheckEmail: "Reservering bevestigd! Controleer uw e-mail voor QR-codes.",
        bookingConfirmedQRReady: "Reservering bevestigd! QR-codes zijn klaar.",
        emailVerificationWarning: "⚠️ E-mailsysteem vereist domeinverificatie. QR-codes zijn beschikbaar op deze pagina.",
        emailNoAddress: "⚠️ Geen e-mailadres opgegeven. Bewaar uw QR-codes vanaf deze pagina.",
        emailErrorWithDetails: "⚠️ E-mail kon niet worden verzonden",
        emailCouldntBeSent: "E-mail kon niet worden verzonden. Bewaar uw QR-codes vanaf deze pagina.",
        serverConnectionIssue: "Serververbindingsprobleem. Uw betaling is verwerkt. Neem contact op met support met uw betalingsbevestiging.",
        paymentFailed: "Betaling mislukt. Probeer het opnieuw.",
      },
      paymentError: {
        title: "Betalingsinitialisatie mislukt",
        message: "Kan betaling niet initialiseren",
        retry: "Opnieuw proberen",
        goBack: "Ga terug",
      },
      bookingErrors: {
        failedMultipleAttempts: "Reservering maken mislukt na meerdere pogingen",
        failedToCreate: "Reservering maken mislukt",
        failedToComplete: "Reservering voltooien mislukt. Probeer het opnieuw.",
      },
      insightTourInfo: {
        title: "Insight Tour",
        description: "Geselecteerde tijdslots omvatten onze Insight Tour, een langere en gedetailleerdere rit waarbij de chauffeur de verhalen en geschiedenis achter de monumenten van Sintra deelt. Zoek naar tijdslots gemarkeerd met het kenmerkende Insight Tour-badge hieronder.",
        badge: "Insight Tour",
      },
      soldOut: {
        title: "Tijdelijk Niet Beschikbaar",
        description: "Alle data zijn momenteel uitverkocht. Kom later terug of neem contact met ons op voor beschikbaarheid.",
        badge: "Uitverkocht",
      },
      step1: {
        selectDate: "Datum Selecteren",
        departureTime: "Vertrektijd",
        seatsLeft: "over",
        note: "Let op:",
      },
      step2: {
        title: "Ophaallocatie & Groepsgrootte",
        description: "Kies uw ophaallocatie en aantal gasten",
        total: "Totaal",
      },
      step3: {
        title: "Attractietickets Toevoegen?",
        skipTicketLines: "Sla de rijen over!",
        pricesShownFor: "Prijzen getoond voor",
        guests: "gasten.",
        notAvailable: "Attractietickets zijn nog niet beschikbaar voor online aankoop. U kunt tickets kopen bij de ingang van elke attractie.",
        each: "elk",
        tipTitle: "Tip:",
        tipDescription: "U ontvangt digitale tickets via e-mail samen met",
        dayPassQRCode: "uw dagpas QR-code",
        dayPassQRCodes: "uw dagpas QR-codes",
        comingSoon: {
          badge: "Online Boeken Binnenkort",
          description: "We werken eraan om de mogelijkheid toe te voegen om attractietickets online te kopen. Voorlopig kunnen tickets worden gekocht bij de ingang van elke attractie.",
          tip: "💡 Uw Hop On Sintra dagpas geeft u onbeperkt vervoer naar alle attracties. Tickets zijn beschikbaar voor aankoop bij aankomst!",
        },
      },
      step4: {
        title: "Uw Informatie",
        fullName: "Volledige Naam",
        emailAddress: "E-mailadres",
        confirmEmail: "E-mail Bevestigen",
        qrCodeSentHere: "Uw QR-code wordt hierheen gestuurd",
        emailsDontMatch: "E-mails komen niet overeen",
      },
      step5: {
        orderSummary: "Besteloverzicht",
        startingAt: "beginnend om",
        guest: "gast",
        guests: "gasten",
        dayPass: "Dagpas",
        guided: "Geleid",
        attractionTickets: "Attractietickets",
        includesGuidedCommentary: "inclusief begeleide commentaar",
        paymentDetails: "Betalingsgegevens",
        preparingPayment: "Veilige betaling voorbereiden...",
        benefits: {
          unlimited: "Onbeperkt hop-on/hop-off tot 20:00 uur",
          guaranteedSeating: "Gegarandeerde zitplaatsen in kleine voertuigen",
          flexible: "Flexibel - gebruik op elk moment tijdens openingstijden",
          qrCode: "QR-code",
          qrCodes: "QR-codes",
          sentViaEmail: "verzonden per e-mail",
          guidedCommentary: "Begeleide commentaar inbegrepen",
        },
      },
      common: {
        back: "Terug",
        continue: "Doorgaan",
        total: "Totaal",
      },
    },
    
    aboutPage: {
      sendMessage: "Bericht Verzenden",
      sending: "Verzenden...",
      messageSent: "Bedankt voor uw bericht! We nemen binnenkort contact met u op.",
      messageError: "Kan bericht niet verzenden. Gebruik WhatsApp of e-mail ons rechtstreeks op info@hoponsintra.com",
      fullName: "Volledige Naam",
      emailAddress: "E-mailadres",
    },
    
    toast: {
      newVersionAvailable: "Nieuwe versie beschikbaar! Ververs om bij te werken.",
      contentUpdated: "Inhoud bijgewerkt!",
      loginSuccess: "🎉 U bent nu ingelogd!",
      loginError: "Inloggen mislukt. Probeer het opnieuw.",
      settingsSaved: "Instellingen succesvol opgeslagen in database!",
      settingsSaveFailed: "Kan instellingen niet opslaan in database. Alleen lokaal opgeslagen.",
      availabilitySaved: "Beschikbaarheid succesvol opgeslagen!",
      availabilitySaveFailed: "Kan beschikbaarheid niet opslaan",
      contentSaved: "Inhoud succesvol opgeslagen in database!",
      contentSaveFailed: "Kan inhoud niet opslaan. Probeer het opnieuw."
    }
  },
  
  it: {
    liveChat: {
      liveSupport: "Supporto Live",
      hereToHelp: "Siamo qui per aiutarti!",
      chatOnWhatsApp: "Chatta su WhatsApp",
      orStartWebChat: "o avvia chat web",
      startWebChat: "Avvia Chat Web",
      starting: "Avvio...",
      conversationSaved: "La tua conversazione è salvata.",
      welcomeMessage: "Ciao! 👋 Benvenuto a Hop On Sintra. Come possiamo aiutarti?",
      enterName: "Inserisci il tuo nome",
      enterEmail: "Inserisci la tua email",
      enterMessage: "Scrivi il tuo messaggio...",
      sendMessage: "Invia",
      goBack: "Indietro"
    },
    
    userProfile: {
      myAccount: "Il Mio Account",
      quickAccess: "Accesso Rapido",
      loginToProfile: "Accedi al Profilo",
      myBooking: "La Mia Prenotazione",
      requestRide: "Richiedi Corsa",
      accessYourBooking: "Accedi alla Tua Prenotazione",
      loginDescription: "Accedi con il tuo ID di prenotazione e cognome per accedere al tuo profilo temporaneo durante la tua visita.",
      bookingId: "ID Prenotazione",
      bookingIdPlaceholder: "es., AB-1234",
      lastName: "Cognome",
      lastNamePlaceholder: "es., Silva",
      login: "Accedi",
      loggingIn: "Accesso...",
      welcomeBack: "Bentornato",
      loggedOut: "Hai effettuato il logout",
      pleaseEnterBoth: "Inserisci sia l'ID di prenotazione che il cognome",
      invalidCredentials: "Credenziali di prenotazione non valide",
      loginFailed: "Accesso fallito. Riprova.",
      logout: "Disconnetti",
      yourPasses: "I Tuoi Pass",
      validFor: "Valido per"
    },
    
    requestPickupPage: {
      verifyBooking: "Verifica la Tua Prenotazione",
      verifyBookingDescription: "Inserisci il tuo codice di prenotazione per richiedere un prelievo. Questo servizio è disponibile solo per i clienti con pass giornalieri attivi.",
      requestPickup: "Richiedi Prelievo",
      requestPickupDescription: "Dicci la dimensione del tuo gruppo e la posizione, e invieremo il veicolo perfetto per te.",
      enterName: "Inserisci il tuo nome",
      groupSize: "Dimensione Gruppo",
      pickupLocation: "Luogo di Prelievo",
      requestingSent: "Richiesta...",
      pickupRequested: "Prelievo Richiesto!",
      pickupRequestedMessage: "Abbiamo ricevuto la tua richiesta e invieremo un veicolo a breve.",
      errorRequestingPickup: "Errore nella richiesta di prelievo"
    },
    
    bookingConfirmation: {
      bookingConfirmed: "Prenotazione Confermata!",
      checkEmail: "Controlla la tua email per la conferma e i codici QR.",
      bookingId: "ID Prenotazione",
      saveForManaging: "Salva questo per gestire la tua prenotazione",
      emailSentTo: "Email di conferma inviata a",
      ticketsSentToEmail: "Il PDF dei tuoi biglietti e i dettagli della prenotazione sono stati inviati alla tua email.",
      bookingSummary: "Riepilogo della Prenotazione",
      booking: "Prenotazione",
      date: "Data",
      passengers: "Passeggini",
      person: "persona",
      people: "persone",
      totalPaid: "Totale Pagato",
      yourDayPassTickets: "I Tuoi Biglietti di Pass Giornaliero",
      downloadPDF: "Scarica PDF",
      downloading: "Scaricamento...",
      printAll: "Stampa Tutto",
      pdfTicketsAttached: "Biglietti PDF Allegati",
      pdfTicketsAttachedDesc: "Ti abbiamo inviato un PDF con tutti i tuoi biglietti alla tua email. Puoi anche scaricarlo qui o salvare i tuoi biglietti di seguito.",
      ticketsReady: "I Tuoi Biglietti Sono Pronti!",
      ticketsReadyDesc: "Mostra questi biglietti al conducente quando sali. Ogni passeggero ha bisogno del suo biglietto con codice QR.",
      howToUseYourPass: "Come Usare il Tuo Pass",
      showQRCode: "Mostra Codice QR",
      showQRCodeDesc: "Mostra il tuo codice QR al conducente quando sali in un veicolo",
      unlimitedRides: "Viaggi Illimitati",
      unlimitedRidesDesc: "Usa il tuo pass per viaggi illimitati hop-on/hop-off fino alle 20:00",
      regularService: "Servizio Regolare",
      regularServiceDesc: "Servizio continuo da tutte le principali attrazioni durante tutto il giorno",
      flexibleSchedule: "Orario Flessibile",
      flexibleScheduleDesc: "Passa quanto tempo vuoi a ogni attrazione",
      thankYou: "Grazie per Aver Scelto Hop On Sintra!",
      adventureBegins: "Siamo entusiasti di mostrarti la magia di Sintra. Il tuo avventura inizia il",
      confirmationSentTo: "La tua conferma di prenotazione e i biglietti sono stati inviati a",
      backToHome: "Torna alla Home",
      manageBooking: "Gestisci Prenotazione",
      viewAttractions: "Vedi Attrazioni",
      tip: "Consiglio",
      tipUseBookingId: "Usa il tuo ID Prenotazione {bookingId} per gestire la tua prenotazione",
      viewRouteMap: "mappa di percorso interattiva",
      questionsOrChanges: "Domande o modifiche necessarie?",
      contactViaEmail: "Contattaci via",
      or: "o",
      unlockFullAccess: "Attiva Accesso Completo",
      loginNow: "Accedi ora per accedere a funzionalità premium durante la tua visita:",
      requestPickup: "Richiedi prelievo",
      requestPickupDesc: "da qualsiasi attrazione a Sintra",
      liveChatSupport: "Supporto chat live",
      liveChatSupportDesc: "con cronologia delle conversazioni salvata",
      viewTickets: "Vedi i tuoi biglietti",
      viewTicketsDesc: "e i dettagli della prenotazione in qualsiasi momento",
      loginInstantly: "Usa il tuo {bold}ID Prenotazione{/bold} e {bold}cognome{/bold} per accedere istantaneamente.",
      loginNowButton: "Accedi Ora",
      youreLoggedIn: "Sei Accesso!",
      fullAccessEnabled: "Hai accesso completo a tutte le funzionalità, inclusa la richiesta di prelievo e il supporto chat live. I tuoi biglietti e i dettagli della prenotazione sono salvati nel tuo profilo.",
      requestPickupFrom: "Richiedi Prelievo",
      downloadTickets: "Scarica Biglietti",
      downloadingTickets: "Scaricamento...",
      noBookingFound: "Nessuna prenotazione trovata. Effettua prima una prenotazione.",
      bookNow: "Prenota Ora",
      insightTourPickup: "Tour Insight - Informazioni Importanti di Prelievo",
      departsAt: "Il tuo tour guidato parte alle",
      meetingPoint: "Punto di Incontro",
      arriveEarly: "Per favore, arriva 10 minuti prima",
      lookForVehicle: "per garantire un partenza puntuale. Cerca il nostro veicolo con il marchio Hop On Sintra e mostra il tuo biglietto al conducente.",
      pdfDownloadSuccess: "PDF scaricato con successo!",
      pdfDownloadError: "Scaricamento PDF fallito"
    },
    
    buyTicketPage: {
      stepDescriptions: {
        step1: "Seleziona la tua data e ora di inizio preferite",
        step2: "Scegli il luogo di ritiro e il numero di ospiti",
      },
      progressLabels: {
        dateTime: "Data e Ora",
        pickupSpot: "Punto di Ritiro",
        attractions: "Attrazioni",
        yourDetails: "I Tuoi Dati",
        confirmation: "Conferma",
      },
      toasts: {
        paymentInitFailed: "Inizializzazione pagamento fallita. Riprova.",
        bookingConfirmedCheckEmail: "Prenotazione confermata! Controlla la tua email per i codici QR.",
        bookingConfirmedQRReady: "Prenotazione confermata! I codici QR sono pronti.",
        emailVerificationWarning: "⚠️ Il sistema email richiede la verifica del dominio. I codici QR sono disponibili su questa pagina.",
        emailNoAddress: "⚠️ Nessun indirizzo email fornito. Salva i tuoi codici QR da questa pagina.",
        emailErrorWithDetails: "⚠️ Impossibile inviare l'email",
        emailCouldntBeSent: "Impossibile inviare l'email. Salva i tuoi codici QR da questa pagina.",
        serverConnectionIssue: "Problema di connessione al server. Il tuo pagamento è stato elaborato. Contatta il supporto con la tua conferma di pagamento.",
        paymentFailed: "Pagamento fallito. Riprova.",
      },
      paymentError: {
        title: "Inizializzazione del pagamento fallita",
        message: "Impossibile inizializzare il pagamento",
        retry: "Riprova",
        goBack: "Torna indietro",
      },
      bookingErrors: {
        failedMultipleAttempts: "Creazione prenotazione fallita dopo più tentativi",
        failedToCreate: "Creazione prenotazione fallita",
        failedToComplete: "Completamento prenotazione fallito. Riprova.",
      },
      insightTourInfo: {
        title: "Insight Tour",
        description: "Alcuni slot orari includono il nostro Insight Tour, un giro più lungo e dettagliato dove l'autista condivide le storie e la storia dietro i monumenti di Sintra. Cerca gli slot orari contrassegnati con il distintivo Insight Tour qui sotto.",
        badge: "Insight Tour",
      },
      soldOut: {
        title: "Temporaneamente Non Disponibile",
        description: "Tutte le date sono attualmente esaurite. Ricontrolla più tardi o contattaci per disponibilità.",
        badge: "Esaurito",
      },
      step1: {
        selectDate: "Seleziona Data",
        departureTime: "Ora di Partenza",
        seatsLeft: "rimasti",
        note: "Nota:",
      },
      step2: {
        title: "Ritiro e Dimensione del Gruppo",
        description: "Scegli il tuo luogo di ritiro e il numero di ospiti",
        total: "Totale",
      },
      step3: {
        title: "Aggiungere Biglietti per Attrazioni?",
        skipTicketLines: "Salta le code!",
        pricesShownFor: "Prezzi mostrati per",
        guests: "ospiti.",
        notAvailable: "I biglietti per le attrazioni non sono ancora disponibili per l'acquisto online. Puoi acquistare i biglietti all'ingresso di ogni attrazione.",
        each: "ciascuno",
        tipTitle: "Suggerimento:",
        tipDescription: "Riceverai biglietti digitali via email insieme a",
        dayPassQRCode: "il tuo codice QR del pass giornaliero",
        dayPassQRCodes: "i tuoi codici QR del pass giornaliero",
        comingSoon: {
          badge: "Prenotazione Online Prossimamente",
          description: "Stiamo lavorando per aggiungere la possibilità di acquistare biglietti per le attrazioni online. Per ora, i biglietti possono essere acquistati all'ingresso di ogni attrazione.",
          tip: "💡 Il tuo pass giornaliero Hop On Sintra ti offre trasporto illimitato verso tutte le attrazioni. I biglietti sono disponibili per l'acquisto all'arrivo!",
        },
      },
      step4: {
        title: "Le Tue Informazioni",
        fullName: "Nome Completo",
        emailAddress: "Indirizzo Email",
        confirmEmail: "Conferma Email",
        qrCodeSentHere: "Il tuo codice QR sarà inviato qui",
        emailsDontMatch: "Le email non corrispondono",
      },
      step5: {
        orderSummary: "Riepilogo Ordine",
        startingAt: "inizio alle",
        guest: "ospite",
        guests: "ospiti",
        dayPass: "Pass Giornaliero",
        guided: "Guidato",
        attractionTickets: "Biglietti per Attrazioni",
        includesGuidedCommentary: "include commento guidato",
        paymentDetails: "Dettagli Pagamento",
        preparingPayment: "Preparazione pagamento sicuro...",
        benefits: {
          unlimited: "Hop-on/hop-off illimitato fino alle 20:00",
          guaranteedSeating: "Posti garantiti in veicoli piccoli",
          flexible: "Flessibile - utilizzabile in qualsiasi momento durante gli orari di apertura",
          qrCode: "Codice QR",
          qrCodes: "Codici QR",
          sentViaEmail: "inviato via email",
          guidedCommentary: "Commento guidato incluso",
        },
      },
      common: {
        back: "Indietro",
        continue: "Continua",
        total: "Totale",
      },
    },
    
    aboutPage: {
      sendMessage: "Invia Messaggio",
      sending: "Invio...",
      messageSent: "Grazie per il tuo messaggio! Ti contatteremo presto.",
      messageError: "Impossibile inviare il messaggio. Usa WhatsApp o inviaci un'email a info@hoponsintra.com",
      fullName: "Nome Completo",
      emailAddress: "Indirizzo Email",
    },
    
    toast: {
      newVersionAvailable: "Nuova versione disponibile! Aggiorna per aggiornare.",
      contentUpdated: "Contenuto aggiornato!",
      loginSuccess: "🎉 Sei ora connesso!",
      loginError: "Accesso fallito. Riprova.",
      settingsSaved: "Impostazioni salvate con successo nel database!",
      settingsSaveFailed: "Impossibile salvare le impostazioni nel database. Salvato solo localmente.",
      availabilitySaved: "Disponibilità salvata con successo!",
      availabilitySaveFailed: "Impossibile salvare la disponibilità",
      contentSaved: "Contenuto salvato con successo nel database!",
      contentSaveFailed: "Impossibile salvare il contenuto. Riprova."
    }
  }
};

export function getComponentTranslation(languageCode: string): ComponentTranslations {
  return componentTranslations[languageCode] || componentTranslations.en;
}