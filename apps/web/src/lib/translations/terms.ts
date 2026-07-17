// Terms of Service Translations
export interface TermsContent {
  title: string;
  lastUpdated: string;
  date: string;
  backToHome: string;
  sections: {
    acceptance: { title: string; content: string[] };
    service: { title: string; intro: string; items: string[] };
    booking: { title: string; items: string[] };
    validity: { title: string; items: string[] };
    cancellation: { title: string; items: string[] };
    responsibilities: { title: string; items: string[] };
    liability: { title: string; content: string[] };
    forceMajeure: { title: string; content: string[] };
    intellectual: { title: string; content: string[] };
    modifications: { title: string; content: string[] };
    law: { title: string; content: string[] };
    contact: { title: string; intro: string };
  };
}

export const termsTranslations: { [key: string]: TermsContent } = {
  en: {
    title: "Terms of Service",
    lastUpdated: "Last Updated",
    date: "October 12, 2025",
    backToHome: "Back to Home",
    sections: {
      acceptance: {
        title: "Acceptance of Terms",
        content: [
          "By accessing and using Go Sintra's hop-on/hop-off day pass service, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.",
          "These terms constitute a legally binding agreement between you and Go Sintra. We reserve the right to modify these terms at any time, and your continued use of our service constitutes acceptance of any changes."
        ]
      },
      service: {
        title: "Service Description",
        intro: "Go Sintra provides a premium hop-on/hop-off day pass service in Sintra, Portugal, including:",
        items: [
          "Unlimited rides on tuk tuks, UMM jeeps, and other small private vehicles throughout Sintra",
          "Guaranteed seating in groups of 2-6 passengers",
          "Regular service every 30 minutes at major attractions",
          "Operating hours: 9:00 AM - 7:00 PM daily",
          "Optional guided tours at 10:00 AM and 2:00 PM departures",
          "Optional attraction ticket bundles",
          "Live GPS tracking and pickup request service"
        ]
      },
      booking: {
        title: "Booking and Payment",
        items: [
          "All bookings must be made through our website or authorized channels",
          "Payment is required at the time of booking to secure your day pass",
          "We accept major credit cards and other payment methods displayed at checkout",
          "All prices are in Euros (€) and include applicable taxes",
          "You will receive a booking confirmation and QR code via email upon successful payment",
          "Each passenger requires their own QR code to board vehicles",
          "Booking confirmations are non-transferable unless explicitly authorized by Go Sintra"
        ]
      },
      validity: {
        title: "Pass Validity and Usage",
        items: [
          "Day passes are valid only for the specific date selected during booking",
          "Passes are valid from 9:00 AM to 8:00 PM on the selected date",
          "Each passenger must present their QR code to the driver when boarding",
          "QR codes are single-use per boarding and will be scanned by our staff",
          "Lost or damaged QR codes should be reported immediately for reissuance",
          "Passes cannot be used on dates other than those booked",
          "Unused passes may be eligible for rescheduling subject to our cancellation policy"
        ]
      },
      cancellation: {
        title: "Cancellation and Refund Policy",
        items: [
          "Cancellations made 48+ hours before the service date: Full refund",
          "Cancellations made 24-48 hours before: 50% refund",
          "Cancellations made less than 24 hours before: No refund",
          "No-shows are not eligible for refunds",
          "Refunds will be processed to the original payment method within 7-10 business days",
          "Weather-related cancellations initiated by Go Sintra will receive full refunds or free rescheduling",
          "To request a cancellation, contact us via email or WhatsApp with your booking ID"
        ]
      },
      responsibilities: {
        title: "User Responsibilities",
        items: [
          "You must arrive at pickup locations on time as vehicles operate on a fixed schedule",
          "You are responsible for the safety and supervision of minors in your group",
          "You must follow all safety instructions provided by our drivers and staff",
          "Smoking, consumption of alcohol, and disruptive behavior are prohibited",
          "You are responsible for your personal belongings; Go Sintra is not liable for lost items",
          "You must respect other passengers, drivers, and local residents",
          "Any damage to vehicles caused by passengers may result in additional charges"
        ]
      },
      liability: {
        title: "Limitation of Liability",
        content: [
          "Go Sintra provides transportation services only and is not responsible for the operation, safety, or policies of third-party attractions.",
          "While we strive to maintain our published schedule, we are not liable for delays caused by traffic, weather, mechanical issues, or other circumstances beyond our control.",
          "Our maximum liability for any claim arising from our services is limited to the amount paid for your day pass. We are not liable for indirect, incidental, or consequential damages.",
          "Go Sintra maintains appropriate insurance coverage for passenger safety during transportation."
        ]
      },
      forceMajeure: {
        title: "Force Majeure",
        content: [
          "Go Sintra shall not be held liable for failure to perform services due to circumstances beyond our reasonable control, including but not limited to: natural disasters, severe weather, pandemics, government restrictions, strikes, or other force majeure events.",
          "In such cases, we will make reasonable efforts to notify affected customers and offer rescheduling or refunds as appropriate."
        ]
      },
      intellectual: {
        title: "Intellectual Property",
        content: [
          "All content on our website and in our materials, including text, graphics, logos, images, and software, is the property of Go Sintra and is protected by intellectual property laws.",
          "You may not copy, reproduce, distribute, or create derivative works from our content without explicit written permission."
        ]
      },
      modifications: {
        title: "Service Modifications",
        content: [
          "We reserve the right to modify our routes, schedules, pricing, and service offerings at any time.",
          "Significant changes that affect existing bookings will be communicated to affected customers with options to cancel for a full refund.",
          "These Terms of Service may be updated periodically. Continued use of our service after changes constitutes acceptance of the modified terms."
        ]
      },
      law: {
        title: "Governing Law",
        content: [
          "These Terms of Service are governed by the laws of Portugal. Any disputes arising from these terms or our services shall be subject to the exclusive jurisdiction of the courts of Sintra, Portugal.",
          "If any provision of these terms is found to be unenforceable, the remaining provisions shall remain in full effect."
        ]
      },
      contact: {
        title: "Contact Information",
        intro: "For questions about these Terms of Service or to exercise your rights, please contact us:"
      }
    }
  },
  pt: {
    title: "Termos de Serviço",
    lastUpdated: "Última Atualização",
    date: "12 de outubro de 2025",
    backToHome: "Voltar ao Início",
    sections: {
      acceptance: {
        title: "Aceitação dos Termos",
        content: [
          "Ao aceder e utilizar o serviço de passe diário hop-on/hop-off da Go Sintra, aceita e concorda em ficar vinculado a estes Termos de Serviço. Se não concordar com estes termos, não utilize o nosso serviço.",
          "Estes termos constituem um acordo juridicamente vinculativo entre si e a Go Sintra. Reservamos o direito de modificar estes termos a qualquer momento, e o seu uso continuado do nosso serviço constitui aceitação de quaisquer alterações."
        ]
      },
      service: {
        title: "Descrição do Serviço",
        intro: "A Go Sintra fornece um serviço premium de passe diário hop-on/hop-off em Sintra, Portugal, incluindo:",
        items: [
          "Viagens ilimitadas em tuk tuks, jipes UMM e outros pequenos veículos privados por toda Sintra",
          "Lugares garantidos em grupos de 2-6 passageiros",
          "Serviço regular a cada 10-15 minutos nas principais atrações",
          "Horário de funcionamento: 9h00 - 20h00 diariamente",
          "Passeios guiados opcionais nas partidas das 10h00 e 14h00",
          "Pacotes opcionais de bilhetes para atrações",
          "Rastreamento GPS ao vivo e serviço de solicitação de recolha"
        ]
      },
      booking: {
        title: "Reserva e Pagamento",
        items: [
          "Todas as reservas devem ser feitas através do nosso website ou canais autorizados",
          "O pagamento é necessário no momento da reserva para garantir o seu passe diário",
          "Aceitamos os principais cartões de crédito e outros métodos de pagamento apresentados no checkout",
          "Todos os preços são em Euros (€) e incluem impostos aplicáveis",
          "Receberá uma confirmação de reserva e código QR por e-mail após pagamento bem-sucedido",
          "Cada passageiro precisa do seu próprio código QR para embarcar nos veículos",
          "As confirmações de reserva não são transferíveis, a menos que explicitamente autorizado pela Go Sintra"
        ]
      },
      validity: {
        title: "Validade e Uso do Passe",
        items: [
          "Os passes diários são válidos apenas para a data específica selecionada durante a reserva",
          "Os passes são válidos das 9h00 às 20h00 na data selecionada",
          "Cada passageiro deve apresentar o seu código QR ao motorista ao embarcar",
          "Os códigos QR são de uso único por embarque e serão digitalizados pelo nosso pessoal",
          "Códigos QR perdidos ou danificados devem ser reportados imediatamente para reemissão",
          "Os passes não podem ser usados em datas diferentes das reservadas",
          "Passes não utilizados podem ser elegíveis para reagendamento sujeito à nossa política de cancelamento"
        ]
      },
      cancellation: {
        title: "Política de Cancelamento e Reembolso",
        items: [
          "Cancelamentos feitos 48+ horas antes da data do serviço: Reembolso total",
          "Cancelamentos feitos 24-48 horas antes: Reembolso de 50%",
          "Cancelamentos feitos menos de 24 horas antes: Sem reembolso",
          "Não comparências não são elegíveis para reembolsos",
          "Os reembolsos serão processados para o método de pagamento original dentro de 7-10 dias úteis",
          "Cancelamentos relacionados com o clima iniciados pela Go Sintra receberão reembolsos totais ou reagendamento gratuito",
          "Para solicitar um cancelamento, contacte-nos por e-mail ou WhatsApp com o seu ID de reserva"
        ]
      },
      responsibilities: {
        title: "Responsabilidades do Utilizador",
        items: [
          "Deve chegar aos locais de recolha a tempo, pois os veículos operam num horário fixo",
          "É responsável pela segurança e supervisão de menores no seu grupo",
          "Deve seguir todas as instruções de segurança fornecidas pelos nossos motoristas e pessoal",
          "É proibido fumar, consumir álcool e ter comportamento perturbador",
          "É responsável pelos seus pertences pessoais; a Go Sintra não é responsável por itens perdidos",
          "Deve respeitar outros passageiros, motoristas e residentes locais",
          "Quaisquer danos aos veículos causados por passageiros podem resultar em cobranças adicionais"
        ]
      },
      liability: {
        title: "Limitação de Responsabilidade",
        content: [
          "A Go Sintra fornece apenas serviços de transporte e não é responsável pela operação, segurança ou políticas de atrações de terceiros.",
          "Embora nos esforcemos para manter o nosso horário publicado, não somos responsáveis por atrasos causados por tráfego, clima, problemas mecânicos ou outras circunstâncias fora do nosso controlo.",
          "A nossa responsabilidade máxima para qualquer reclamação decorrente dos nossos serviços é limitada ao valor pago pelo seu passe diário. Não somos responsáveis por danos indiretos, incidentais ou consequentes.",
          "A Go Sintra mantém cobertura de seguro apropriada para a segurança dos passageiros durante o transporte."
        ]
      },
      forceMajeure: {
        title: "Força Maior",
        content: [
          "A Go Sintra não será responsabilizada por falha na prestação de serviços devido a circunstâncias além do nosso controlo razoável, incluindo mas não limitado a: desastres naturais, clima severo, pandemias, restrições governamentais, greves ou outros eventos de força maior.",
          "Em tais casos, faremos esforços razoáveis para notificar os clientes afetados e oferecer reagendamento ou reembolsos conforme apropriado."
        ]
      },
      intellectual: {
        title: "Propriedade Intelectual",
        content: [
          "Todo o conteúdo no nosso website e nos nossos materiais, incluindo texto, gráficos, logotipos, imagens e software, é propriedade da Go Sintra e está protegido por leis de propriedade intelectual.",
          "Não pode copiar, reproduzir, distribuir ou criar obras derivadas do nosso conteúdo sem permissão explícita por escrito."
        ]
      },
      modifications: {
        title: "Modificações do Serviço",
        content: [
          "Reservamo-nos o direito de modificar as nossas rotas, horários, preços e ofertas de serviço a qualquer momento.",
          "Mudanças significativas que afetem reservas existentes serão comunicadas aos clientes afetados com opções para cancelar para um reembolso total.",
          "Estes Termos de Serviço podem ser atualizados periodicamente. O uso continuado do nosso serviço após alterações constitui aceitação dos termos modificados."
        ]
      },
      law: {
        title: "Lei Aplicável",
        content: [
          "Estes Termos de Serviço são regidos pelas leis de Portugal. Quaisquer disputas decorrentes destes termos ou dos nossos serviços estarão sujeitas à jurisdição exclusiva dos tribunais de Sintra, Portugal.",
          "Se qualquer disposição destes termos for considerada inexequível, as disposições restantes permanecerão em pleno vigor."
        ]
      },
      contact: {
        title: "Informações de Contacto",
        intro: "Para questões sobre estes Termos de Serviço ou para exercer os seus direitos, contacte-nos:"
      }
    }
  },
  es: {
    title: "Términos de Servicio",
    lastUpdated: "Última Actualización",
    date: "12 de octubre de 2025",
    backToHome: "Volver al Inicio",
    sections: {
      acceptance: {
        title: "Aceptación de los Términos",
        content: [
          "Al acceder y usar el servicio de pase diario hop-on/hop-off de Go Sintra, acepta y acepta estar obligado por estos Términos de Servicio. Si no está de acuerdo con estos términos, no use nuestro servicio.",
          "Estos términos constituyen un acuerdo legalmente vinculante entre usted y Go Sintra. Nos reservamos el derecho de modificar estos términos en cualquier momento, y su uso continuado de nuestro servicio constituye la aceptación de cualquier cambio."
        ]
      },
      service: {
        title: "Descripción del Servicio",
        intro: "Go Sintra proporciona un servicio premium de pase diario hop-on/hop-off en Sintra, Portugal, que incluye:",
        items: [
          "Viajes ilimitados en tuk tuks, jeeps UMM y otros pequeños vehículos privados por todo Sintra",
          "Asientos garantizados en grupos de 2-6 pasajeros",
          "Servicio regular cada 10-15 minutos en las principales atracciones",
          "Horario de operación: 9:00 AM - 8:00 PM diariamente",
          "Tours guiados opcionales en las salidas de 10:00 AM y 2:00 PM",
          "Paquetes opcionales de boletos para atracciones",
          "Seguimiento GPS en vivo y servicio de solicitud de recogida"
        ]
      },
      booking: {
        title: "Reserva y Pago",
        items: [
          "Todas las reservas deben hacerse a través de nuestro sitio web o canales autorizados",
          "Se requiere el pago en el momento de la reserva para asegurar su pase diario",
          "Aceptamos las principales tarjetas de crédito y otros métodos de pago mostrados en el checkout",
          "Todos los precios están en Euros (€) e incluyen impuestos aplicables",
          "Recibirá una confirmación de reserva y código QR por correo electrónico después del pago exitoso",
          "Cada pasajero requiere su propio código QR para abordar los vehículos",
          "Las confirmaciones de reserva no son transferibles a menos que Go Sintra lo autorice explícitamente"
        ]
      },
      validity: {
        title: "Validez y Uso del Pase",
        items: [
          "Los pases diarios son válidos solo para la fecha específica seleccionada durante la reserva",
          "Los pases son válidos de 9:00 AM a 8:00 PM en la fecha seleccionada",
          "Cada pasajero debe presentar su código QR al conductor al abordar",
          "Los códigos QR son de un solo uso por abordaje y serán escaneados por nuestro personal",
          "Los códigos QR perdidos o dañados deben ser reportados inmediatamente para su reemisión",
          "Los pases no se pueden usar en fechas diferentes a las reservadas",
          "Los pases no utilizados pueden ser elegibles para reprogramación sujeto a nuestra política de cancelación"
        ]
      },
      cancellation: {
        title: "Política de Cancelación y Reembolso",
        items: [
          "Cancelaciones hechas 48+ horas antes de la fecha del servicio: Reembolso completo",
          "Cancelaciones hechas 24-48 horas antes: Reembolso del 50%",
          "Cancelaciones hechas menos de 24 horas antes: Sin reembolso",
          "Las no presentaciones no son elegibles para reembolsos",
          "Los reembolsos se procesarán al método de pago original dentro de 7-10 días hábiles",
          "Las cancelaciones relacionadas con el clima iniciadas por Go Sintra recibirán reembolsos completos o reprogramación gratuita",
          "Para solicitar una cancelación, contáctenos por correo electrónico o WhatsApp con su ID de reserva"
        ]
      },
      responsibilities: {
        title: "Responsabilidades del Usuario",
        items: [
          "Debe llegar a los puntos de recogida a tiempo ya que los vehículos operan en un horario fijo",
          "Es responsable de la seguridad y supervisión de menores en su grupo",
          "Debe seguir todas las instrucciones de seguridad proporcionadas por nuestros conductores y personal",
          "Está prohibido fumar, consumir alcohol y tener comportamiento perturbador",
          "Es responsable de sus pertenencias personales; Go Sintra no es responsable de artículos perdidos",
          "Debe respetar a otros pasajeros, conductores y residentes locales",
          "Cualquier daño a los vehículos causado por pasajeros puede resultar en cargos adicionales"
        ]
      },
      liability: {
        title: "Limitación de Responsabilidad",
        content: [
          "Go Sintra proporciona solo servicios de transporte y no es responsable de la operación, seguridad o políticas de atracciones de terceros.",
          "Aunque nos esforzamos por mantener nuestro horario publicado, no somos responsables de retrasos causados por tráfico, clima, problemas mecánicos u otras circunstancias fuera de nuestro control.",
          "Nuestra responsabilidad máxima para cualquier reclamo que surja de nuestros servicios está limitada al monto pagado por su pase diario. No somos responsables de daños indirectos, incidentales o consecuentes.",
          "Go Sintra mantiene cobertura de seguro apropiada para la seguridad de los pasajeros durante el transporte."
        ]
      },
      forceMajeure: {
        title: "Fuerza Mayor",
        content: [
          "Go Sintra no será responsable por el incumplimiento de la prestación de servicios debido a circunstancias más allá de nuestro control razonable, incluyendo pero no limitado a: desastres naturales, clima severo, pandemias, restricciones gubernamentales, huelgas u otros eventos de fuerza mayor.",
          "En tales casos, haremos esfuerzos razonables para notificar a los clientes afectados y ofrecer reprogramación o reembolsos según corresponda."
        ]
      },
      intellectual: {
        title: "Propiedad Intelectual",
        content: [
          "Todo el contenido en nuestro sitio web y en nuestros materiales, incluidos texto, gráficos, logotipos, imágenes y software, es propiedad de Go Sintra y está protegido por leyes de propiedad intelectual.",
          "No puede copiar, reproducir, distribuir o crear obras derivadas de nuestro contenido sin permiso explícito por escrito."
        ]
      },
      modifications: {
        title: "Modificaciones del Servicio",
        content: [
          "Nos reservamos el derecho de modificar nuestras rutas, horarios, precios y ofertas de servicio en cualquier momento.",
          "Los cambios significativos que afecten las reservas existentes se comunicarán a los clientes afectados con opciones para cancelar y obtener un reembolso completo.",
          "Estos Términos de Servicio pueden actualizarse periódicamente. El uso continuado de nuestro servicio después de los cambios constituye la aceptación de los términos modificados."
        ]
      },
      law: {
        title: "Ley Aplicable",
        content: [
          "Estos Términos de Servicio se rigen por las leyes de Portugal. Cualquier disputa que surja de estos términos o de nuestros servicios estará sujeta a la jurisdicción exclusiva de los tribunales de Sintra, Portugal.",
          "Si alguna disposición de estos términos se considera inaplicable, las disposiciones restantes permanecerán en pleno vigor."
        ]
      },
      contact: {
        title: "Información de Contacto",
        intro: "Para preguntas sobre estos Términos de Servicio o para ejercer sus derechos, contáctenos:"
      }
    }
  },
  fr: {
    title: "Conditions d'Utilisation",
    lastUpdated: "Dernière Mise à Jour",
    date: "12 octobre 2025",
    backToHome: "Retour à l'Accueil",
    sections: {
      acceptance: {
        title: "Acceptation des Conditions",
        content: [
          "En accédant et en utilisant le service de pass journalier hop-on/hop-off de Go Sintra, vous acceptez et acceptez d'être lié par ces Conditions d'Utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre service.",
          "Ces conditions constituent un accord juridiquement contraignant entre vous et Go Sintra. Nous nous réservons le droit de modifier ces conditions à tout moment, et votre utilisation continue de notre service constitue l'acceptation de tout changement."
        ]
      },
      service: {
        title: "Description du Service",
        intro: "Go Sintra fournit un service premium de pass journalier hop-on/hop-off à Sintra, Portugal, comprenant:",
        items: [
          "Trajets illimités en tuk tuks, jeeps UMM et autres petits véhicules privés à travers Sintra",
          "Sièges garantis en groupes de 2-6 passagers",
          "Service régulier toutes les 10-15 minutes aux principales attractions",
          "Heures d'ouverture: 9h00 - 20h00 tous les jours",
          "Visites guidées optionnelles aux départs de 10h00 et 14h00",
          "Forfaits de billets d'attractions optionnels",
          "Suivi GPS en direct et service de demande de ramassage"
        ]
      },
      booking: {
        title: "Réservation et Paiement",
        items: [
          "Toutes les réservations doivent être effectuées via notre site web ou nos canaux autorisés",
          "Le paiement est requis au moment de la réservation pour sécuriser votre pass journalier",
          "Nous acceptons les principales cartes de crédit et autres méthodes de paiement affichées lors du paiement",
          "Tous les prix sont en Euros (€) et incluent les taxes applicables",
          "Vous recevrez une confirmation de réservation et un code QR par e-mail après un paiement réussi",
          "Chaque passager a besoin de son propre code QR pour monter dans les véhicules",
          "Les confirmations de réservation ne sont pas transférables sauf autorisation explicite de Go Sintra"
        ]
      },
      validity: {
        title: "Validité et Utilisation du Pass",
        items: [
          "Les pass journaliers ne sont valables que pour la date spécifique sélectionnée lors de la réservation",
          "Les pass sont valables de 9h00 à 20h00 à la date sélectionnée",
          "Chaque passager doit présenter son code QR au conducteur lors de l'embarquement",
          "Les codes QR sont à usage unique par embarquement et seront scannés par notre personnel",
          "Les codes QR perdus ou endommagés doivent être signalés immédiatement pour réémission",
          "Les pass ne peuvent pas être utilisés à des dates autres que celles réservées",
          "Les pass non utilisés peuvent être éligibles à une reprogrammation sous réserve de notre politique d'annulation"
        ]
      },
      cancellation: {
        title: "Politique d'Annulation et de Remboursement",
        items: [
          "Annulations effectuées 48+ heures avant la date du service: Remboursement complet",
          "Annulations effectuées 24-48 heures avant: Remboursement de 50%",
          "Annulations effectuées moins de 24 heures avant: Pas de remboursement",
          "Les non-présentations ne sont pas éligibles aux remboursements",
          "Les remboursements seront traités vers le mode de paiement original dans un délai de 7-10 jours ouvrables",
          "Les annulations liées aux conditions météorologiques initiées par Go Sintra recevront des remboursements complets ou une reprogrammation gratuite",
          "Pour demander une annulation, contactez-nous par e-mail ou WhatsApp avec votre ID de réservation"
        ]
      },
      responsibilities: {
        title: "Responsabilités de l'Utilisateur",
        items: [
          "Vous devez arriver aux points de ramassage à l'heure car les véhicules fonctionnent selon un horaire fixe",
          "Vous êtes responsable de la sécurité et de la supervision des mineurs dans votre groupe",
          "Vous devez suivre toutes les instructions de sécurité fournies par nos conducteurs et notre personnel",
          "Il est interdit de fumer, de consommer de l'alcool et d'avoir un comportement perturbateur",
          "Vous êtes responsable de vos effets personnels; Go Sintra n'est pas responsable des objets perdus",
          "Vous devez respecter les autres passagers, les conducteurs et les résidents locaux",
          "Tout dommage aux véhicules causé par les passagers peut entraîner des frais supplémentaires"
        ]
      },
      liability: {
        title: "Limitation de Responsabilité",
        content: [
          "Go Sintra fournit uniquement des services de transport et n'est pas responsable de l'exploitation, de la sécurité ou des politiques des attractions tierces.",
          "Bien que nous nous efforcions de maintenir notre horaire publié, nous ne sommes pas responsables des retards causés par la circulation, les conditions météorologiques, les problèmes mécaniques ou d'autres circonstances hors de notre contrôle.",
          "Notre responsabilité maximale pour toute réclamation découlant de nos services est limitée au montant payé pour votre pass journalier. Nous ne sommes pas responsables des dommages indirects, accessoires ou consécutifs.",
          "Go Sintra maintient une couverture d'assurance appropriée pour la sécurité des passagers pendant le transport."
        ]
      },
      forceMajeure: {
        title: "Force Majeure",
        content: [
          "Go Sintra ne sera pas tenu responsable de l'impossibilité de fournir des services en raison de circonstances indépendantes de notre volonté raisonnable, y compris mais sans s'y limiter: catastrophes naturelles, conditions météorologiques extrêmes, pandémies, restrictions gouvernementales, grèves ou autres événements de force majeure.",
          "Dans de tels cas, nous ferons des efforts raisonnables pour notifier les clients affectés et offrir une reprogrammation ou des remboursements selon le cas."
        ]
      },
      intellectual: {
        title: "Propriété Intellectuelle",
        content: [
          "Tout le contenu de notre site web et dans nos matériaux, y compris le texte, les graphiques, les logos, les images et les logiciels, est la propriété de Go Sintra et est protégé par les lois sur la propriété intellectuelle.",
          "Vous ne pouvez pas copier, reproduire, distribuer ou créer des œuvres dérivées de notre contenu sans autorisation écrite explicite."
        ]
      },
      modifications: {
        title: "Modifications du Service",
        content: [
          "Nous nous réservons le droit de modifier nos itinéraires, horaires, tarifs et offres de services à tout moment.",
          "Les changements importants qui affectent les réservations existantes seront communiqués aux clients concernés avec des options d'annulation pour un remboursement complet.",
          "Ces Conditions d'Utilisation peuvent être mises à jour périodiquement. L'utilisation continue de notre service après les modifications constitue l'acceptation des conditions modifiées."
        ]
      },
      law: {
        title: "Loi Applicable",
        content: [
          "Ces Conditions d'Utilisation sont régies par les lois du Portugal. Tout litige découlant de ces conditions ou de nos services sera soumis à la juridiction exclusive des tribunaux de Sintra, Portugal.",
          "Si une disposition de ces conditions est jugée inapplicable, les dispositions restantes resteront en vigueur."
        ]
      },
      contact: {
        title: "Informations de Contact",
        intro: "Pour des questions sur ces Conditions d'Utilisation ou pour exercer vos droits, veuillez nous contacter:"
      }
    }
  },
  de: {
    title: "Nutzungsbedingungen",
    lastUpdated: "Letzte Aktualisierung",
    date: "12. Oktober 2025",
    backToHome: "Zurück zur Startseite",
    sections: {
      acceptance: {
        title: "Annahme der Bedingungen",
        content: [
          "Durch den Zugriff auf und die Nutzung des Hop-on/Hop-off-Tagespass-Service von Go Sintra akzeptieren Sie diese Nutzungsbedingungen und erklären sich damit einverstanden, an sie gebunden zu sein. Wenn Sie mit diesen Bedingungen nicht einverstanden sind, nutzen Sie bitte unseren Service nicht.",
          "Diese Bedingungen stellen eine rechtlich bindende Vereinbarung zwischen Ihnen und Go Sintra dar. Wir behalten uns das Recht vor, diese Bedingungen jederzeit zu ändern, und Ihre fortgesetzte Nutzung unseres Service stellt die Annahme aller Änderungen dar."
        ]
      },
      service: {
        title: "Servicebeschreibung",
        intro: "Go Sintra bietet einen Premium-Hop-on/Hop-off-Tagespass-Service in Sintra, Portugal, einschließlich:",
        items: [
          "Unbegrenzte Fahrten mit Tuk Tuks, UMM-Jeeps und anderen kleinen Privatfahrzeugen durch Sintra",
          "Garantierte Sitzplätze in Gruppen von 2-6 Passagieren",
          "Regelmäßiger Service alle 10-15 Minuten bei Hauptattraktionen",
          "Betriebszeiten: 9:00 Uhr - 20:00 Uhr täglich",
          "Optionale geführte Touren bei Abfahrten um 10:00 Uhr und 14:00 Uhr",
          "Optionale Attraktions-Ticketpakete",
          "Live-GPS-Tracking und Abholservice-Anfrage"
        ]
      },
      booking: {
        title: "Buchung und Zahlung",
        items: [
          "Alle Buchungen müssen über unsere Website oder autorisierte Kanäle erfolgen",
          "Die Zahlung ist zum Zeitpunkt der Buchung erforderlich, um Ihren Tagespass zu sichern",
          "Wir akzeptieren gängige Kreditkarten und andere beim Checkout angezeigte Zahlungsmethoden",
          "Alle Preise sind in Euro (€) und enthalten anwendbare Steuern",
          "Sie erhalten eine Buchungsbestätigung und einen QR-Code per E-Mail nach erfolgreicher Zahlung",
          "Jeder Passagier benötigt seinen eigenen QR-Code zum Einsteigen in Fahrzeuge",
          "Buchungsbestätigungen sind nicht übertragbar, es sei denn, dies wird von Go Sintra ausdrücklich genehmigt"
        ]
      },
      validity: {
        title: "Pass-Gültigkeit und Nutzung",
        items: [
          "Tagespässe sind nur für das bei der Buchung ausgewählte Datum gültig",
          "Pässe sind am ausgewählten Datum von 9:00 Uhr bis 20:00 Uhr gültig",
          "Jeder Passagier muss beim Einsteigen seinen QR-Code dem Fahrer vorzeigen",
          "QR-Codes sind einmalig pro Einstieg verwendbar und werden von unserem Personal gescannt",
          "Verlorene oder beschädigte QR-Codes sollten sofort zur Neuausstellung gemeldet werden",
          "Pässe können nicht an anderen als den gebuchten Daten verwendet werden",
          "Nicht genutzte Pässe können vorbehaltlich unserer Stornierungsbedingungen zur Umplanung berechtigt sein"
        ]
      },
      cancellation: {
        title: "Stornierungsrichtlinie und Rückerstattung",
        items: [
          "Stornierungen 48+ Stunden vor dem Service-Datum: Vollständige Rückerstattung",
          "Stornierungen 24-48 Stunden vorher: 50% Rückerstattung",
          "Stornierungen weniger als 24 Stunden vorher: Keine Rückerstattung",
          "Nichterscheinen berechtigt nicht zur Rückerstattung",
          "Rückerstattungen werden innerhalb von 7-10 Werktagen auf die ursprüngliche Zahlungsmethode verarbeitet",
          "Wetterbedingte Stornierungen, die von Go Sintra initiiert werden, erhalten vollständige Rückerstattungen oder kostenlose Umplanung",
          "Um eine Stornierung anzufordern, kontaktieren Sie uns per E-Mail oder WhatsApp mit Ihrer Buchungs-ID"
        ]
      },
      responsibilities: {
        title: "Nutzerpflichten",
        items: [
          "Sie müssen pünktlich an den Abholorten erscheinen, da die Fahrzeuge nach einem festen Zeitplan fahren",
          "Sie sind für die Sicherheit und Aufsicht von Minderjährigen in Ihrer Gruppe verantwortlich",
          "Sie müssen alle Sicherheitsanweisungen unserer Fahrer und Mitarbeiter befolgen",
          "Rauchen, Alkoholkonsum und störendes Verhalten sind verboten",
          "Sie sind für Ihre persönlichen Gegenstände verantwortlich; Go Sintra haftet nicht für verlorene Gegenstände",
          "Sie müssen andere Passagiere, Fahrer und Anwohner respektieren",
          "Schäden an Fahrzeugen, die von Passagieren verursacht werden, können zu zusätzlichen Gebühren führen"
        ]
      },
      liability: {
        title: "Haftungsbeschränkung",
        content: [
          "Go Sintra bietet nur Transportdienste an und ist nicht verantwortlich für den Betrieb, die Sicherheit oder die Richtlinien von Drittanbieter-Attraktionen.",
          "Obwohl wir uns bemühen, unseren veröffentlichten Zeitplan einzuhalten, haften wir nicht für Verzögerungen aufgrund von Verkehr, Wetter, mechanischen Problemen oder anderen Umständen außerhalb unserer Kontrolle.",
          "Unsere maximale Haftung für Ansprüche aus unseren Dienstleistungen ist auf den für Ihren Tagespass gezahlten Betrag begrenzt. Wir haften nicht für indirekte, zufällige oder Folgeschäden.",
          "Go Sintra unterhält angemessenen Versicherungsschutz für die Passagiersicherheit während des Transports."
        ]
      },
      forceMajeure: {
        title: "Höhere Gewalt",
        content: [
          "Go Sintra haftet nicht für die Nichterbringung von Dienstleistungen aufgrund von Umständen außerhalb unserer angemessenen Kontrolle, einschließlich, aber nicht beschränkt auf: Naturkatastrophen, schweres Wetter, Pandemien, behördliche Beschränkungen, Streiks oder andere Ereignisse höherer Gewalt.",
          "In solchen Fällen werden wir angemessene Anstrengungen unternehmen, um betroffene Kunden zu benachrichtigen und Umplanung oder Rückerstattungen anzubieten, wie angemessen."
        ]
      },
      intellectual: {
        title: "Geistiges Eigentum",
        content: [
          "Alle Inhalte auf unserer Website und in unseren Materialien, einschließlich Text, Grafiken, Logos, Bilder und Software, sind Eigentum von Go Sintra und durch Gesetze zum Schutz geistigen Eigentums geschützt.",
          "Sie dürfen unsere Inhalte nicht kopieren, reproduzieren, verteilen oder abgeleitete Werke erstellen ohne ausdrückliche schriftliche Genehmigung."
        ]
      },
      modifications: {
        title: "Service-Änderungen",
        content: [
          "Wir behalten uns das Recht vor, unsere Routen, Zeitpläne, Preise und Serviceangebote jederzeit zu ändern.",
          "Wesentliche Änderungen, die bestehende Buchungen betreffen, werden den betroffenen Kunden mit Optionen zur Stornierung für eine vollständige Rückerstattung mitgeteilt.",
          "Diese Nutzungsbedingungen können regelmäßig aktualisiert werden. Die fortgesetzte Nutzung unseres Service nach Änderungen stellt die Annahme der geänderten Bedingungen dar."
        ]
      },
      law: {
        title: "Anwendbares Recht",
        content: [
          "Diese Nutzungsbedingungen unterliegen den Gesetzen Portugals. Alle Streitigkeiten, die sich aus diesen Bedingungen oder unseren Dienstleistungen ergeben, unterliegen der ausschließlichen Gerichtsbarkeit der Gerichte von Sintra, Portugal.",
          "Sollte eine Bestimmung dieser Bedingungen für nicht durchsetzbar befunden werden, bleiben die übrigen Bestimmungen in vollem Umfang in Kraft."
        ]
      },
      contact: {
        title: "Kontaktinformationen",
        intro: "Für Fragen zu diesen Nutzungsbedingungen oder zur Ausübung Ihrer Rechte kontaktieren Sie uns bitte:"
      }
    }
  }
};

export function getTermsContent(languageCode: string): TermsContent {
  return termsTranslations[languageCode] || termsTranslations.en;
}
