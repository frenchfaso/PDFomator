// PDFomator - Main Application Logic
// ES Module with vanilla JavaScript for PDF page layout

import * as pdfjsLib from './vendor/pdf.mjs';

const SUPPORTED_LANGUAGES = ['en', 'it', 'de', 'es', 'fr'];
const FALLBACK_LANGUAGE = 'en';
const I18N_RESOURCES = {
    en: {
        translation: {
            app: {
                description: 'Mobile-first PWA for arranging PDF pages and images into printable sheets with local OCR text export'
            },
            common: {
                cancel: 'Cancel'
            },
            actions: {
                changePaperSize: 'Change Paper Size',
                selectGrid: 'Select Grid Layout',
                runOcr: 'Run OCR',
                exportPdf: 'Export PDF'
            },
            page: {
                controls: 'Page controls',
                previous: 'Previous Page',
                next: 'Next Page',
                add: 'Add Page',
                remove: 'Remove Current Page',
                deleteConfirm: 'Delete this page and its contents?'
            },
            grid: {
                title: 'Select Grid Size',
                shrinkWarning_one: 'Warning: changing to a {{cols}} × {{rows}} grid will remove {{removedCells}} cells.\n\nThis will permanently delete {{count}} content item from your layout.\n\nContinue?',
                shrinkWarning_other: 'Warning: changing to a {{cols}} × {{rows}} grid will remove {{removedCells}} cells.\n\nThis will permanently delete {{count}} content items from your layout.\n\nContinue?'
            },
            paper: {
                title: 'Select Paper Size & Orientation',
                a4Portrait: 'A4 Portrait',
                a4Landscape: 'A4 Landscape',
                a3Portrait: 'A3 Portrait',
                a3Landscape: 'A3 Landscape'
            },
            pdfPage: {
                title: 'Select PDF Page',
                selectAria: 'Select PDF page {{page}}',
                loading: 'Loading...',
                pageLabel: 'Page {{page}}',
                pageErrorLabel: 'Page {{page}} (Error)',
                previewUnavailable: 'Preview unavailable',
                processingSelected: 'Processing selected page...',
                processSelectedFailed: 'Failed to process selected page.'
            },
            export: {
                title: 'Export Quality',
                sdTitle: 'SD (web, mail)',
                sdDescription: 'Smaller files',
                hdTitle: 'HD (print)',
                hdDescription: 'Bigger files',
                standardLabel: 'Standard (Fast)',
                highLabel: 'High Quality',
                noContent: 'Please add some content to export!',
                exporting: 'Exporting in {{quality}} quality...',
                rasterizingPage: 'Rasterizing page {{current}} of {{total}}...',
                assembling: 'Assembling PDF...',
                preparingDownload: 'Preparing download...',
                complete: 'Export complete!',
                failed: 'Export failed. Please try again.'
            },
            fileType: {
                title: 'Choose Content Type',
                pdf: 'PDF Document',
                image: 'Image File',
                camera: 'Camera'
            },
            camera: {
                title: 'Take Photo',
                device: 'Camera',
                capturedPreview: 'Captured photo preview',
                capture: 'Capture',
                usePhoto: 'Use Photo',
                retake: 'Retake',
                unavailable: 'Camera access is unavailable. Please use Image File instead.',
                switchFailed: 'Failed to switch camera. Please try another device.',
                previewNotReady: 'Camera preview is not ready yet. Please try again.',
                captureFailed: 'Failed to capture photo. Please try again.',
                processFailed: 'Failed to process photo. Please try again.',
                useFailed: 'Failed to use captured photo. Please try again.',
                deviceFallback: 'Camera {{index}}',
                photoTitle: 'Camera photo'
            },
            loading: {
                title: 'Loading',
                processing: 'Processing...',
                processingPdf: 'Processing PDF...',
                processingImage: 'Processing image...',
                processingPhoto: 'Processing photo...'
            },
            filters: {
                bitonalThreshold: '1-bit threshold',
                applyFailed: 'Failed to apply filter. Please try again.'
            },
            image: {
                processFailed: 'Failed to process image. Please try again.',
                rotateFailed: 'Failed to rotate image. Please try again.'
            },
            pdf: {
                jsIncomplete: 'PDF.js failed to load completely. Please refresh the page.',
                jsLoadFailed: 'PDF processing library failed to load. Please refresh the page.',
                processFailed: 'Failed to process PDF. Please try again.',
                libraryNotLoaded: 'PDF.js library not loaded. Please refresh the page and try again.'
            },
            ocr: {
                noImages: 'No images to OCR.',
                loadingEngine: 'Loading OCR engine...',
                preparingPage: 'Preparing OCR page {{current}} of {{total}}...',
                runningCell: 'OCR page {{page}}, cell {{cell}}...',
                completeNoText: 'OCR complete: no text found.',
                completeWithText_one: 'Selectable text ready: {{count}} line recognized.',
                completeWithText_other: 'Selectable text ready: {{count}} lines recognized.',
                failed: 'OCR failed. Please try again.',
                noExportableCells: 'No exportable cells found for OCR.'
            },
            errors: {
                prefix: 'PDFomator Error: {{message}}',
                unexpected: 'An unexpected error occurred. Please refresh the page and try again.'
            },
            update: {
                available: 'App updated! New version available.',
                refresh: 'Refresh',
                dismiss: 'Dismiss'
            }
        }
    },
    it: {
        translation: {
            app: {
                description: 'PWA mobile per impaginare pagine PDF e immagini su fogli stampabili con OCR locale'
            },
            common: {
                cancel: 'Annulla'
            },
            actions: {
                changePaperSize: 'Cambia formato carta',
                selectGrid: 'Seleziona griglia',
                runOcr: 'Esegui OCR',
                exportPdf: 'Esporta PDF'
            },
            page: {
                controls: 'Controlli pagina',
                previous: 'Pagina precedente',
                next: 'Pagina successiva',
                add: 'Aggiungi pagina',
                remove: 'Rimuovi pagina corrente',
                deleteConfirm: 'Eliminare questa pagina e il suo contenuto?'
            },
            grid: {
                title: 'Seleziona dimensione griglia',
                shrinkWarning_one: 'Attenzione: passando a una griglia {{cols}} × {{rows}} verranno rimosse {{removedCells}} celle.\n\nQuesto eliminerà definitivamente {{count}} elemento dal layout.\n\nContinuare?',
                shrinkWarning_other: 'Attenzione: passando a una griglia {{cols}} × {{rows}} verranno rimosse {{removedCells}} celle.\n\nQuesto eliminerà definitivamente {{count}} elementi dal layout.\n\nContinuare?'
            },
            paper: {
                title: 'Seleziona formato carta e orientamento',
                a4Portrait: 'A4 verticale',
                a4Landscape: 'A4 orizzontale',
                a3Portrait: 'A3 verticale',
                a3Landscape: 'A3 orizzontale'
            },
            pdfPage: {
                title: 'Seleziona pagina PDF',
                selectAria: 'Seleziona pagina PDF {{page}}',
                loading: 'Caricamento...',
                pageLabel: 'Pagina {{page}}',
                pageErrorLabel: 'Pagina {{page}} (errore)',
                previewUnavailable: 'Anteprima non disponibile',
                processingSelected: 'Elaborazione pagina selezionata...',
                processSelectedFailed: 'Impossibile elaborare la pagina selezionata.'
            },
            export: {
                title: 'Qualità esportazione',
                sdTitle: 'SD (web, email)',
                sdDescription: 'File più piccoli',
                hdTitle: 'HD (stampa)',
                hdDescription: 'File più grandi',
                standardLabel: 'Standard (veloce)',
                highLabel: 'Alta qualità',
                noContent: 'Aggiungi contenuto da esportare.',
                exporting: 'Esportazione in qualità {{quality}}...',
                rasterizingPage: 'Rasterizzazione pagina {{current}} di {{total}}...',
                assembling: 'Assemblaggio PDF...',
                preparingDownload: 'Preparazione download...',
                complete: 'Esportazione completata.',
                failed: 'Esportazione non riuscita. Riprova.'
            },
            fileType: {
                title: 'Scegli tipo di contenuto',
                pdf: 'Documento PDF',
                image: 'File immagine',
                camera: 'Fotocamera'
            },
            camera: {
                title: 'Scatta foto',
                device: 'Fotocamera',
                capturedPreview: 'Anteprima foto acquisita',
                capture: 'Scatta',
                usePhoto: 'Usa foto',
                retake: 'Riscatta',
                unavailable: 'Accesso alla fotocamera non disponibile. Usa File immagine.',
                switchFailed: 'Cambio fotocamera non riuscito. Prova un altro dispositivo.',
                previewNotReady: 'Anteprima fotocamera non ancora pronta. Riprova.',
                captureFailed: 'Acquisizione foto non riuscita. Riprova.',
                processFailed: 'Elaborazione foto non riuscita. Riprova.',
                useFailed: 'Impossibile usare la foto acquisita. Riprova.',
                deviceFallback: 'Fotocamera {{index}}',
                photoTitle: 'Foto da fotocamera'
            },
            loading: {
                title: 'Caricamento',
                processing: 'Elaborazione...',
                processingPdf: 'Elaborazione PDF...',
                processingImage: 'Elaborazione immagine...',
                processingPhoto: 'Elaborazione foto...'
            },
            filters: {
                bitonalThreshold: 'Soglia 1-bit',
                applyFailed: 'Applicazione filtro non riuscita. Riprova.'
            },
            image: {
                processFailed: 'Elaborazione immagine non riuscita. Riprova.',
                rotateFailed: 'Rotazione immagine non riuscita. Riprova.'
            },
            pdf: {
                jsIncomplete: 'PDF.js non è stato caricato completamente. Aggiorna la pagina.',
                jsLoadFailed: 'Libreria di elaborazione PDF non caricata. Aggiorna la pagina.',
                processFailed: 'Elaborazione PDF non riuscita. Riprova.',
                libraryNotLoaded: 'Libreria PDF.js non caricata. Aggiorna la pagina e riprova.'
            },
            ocr: {
                noImages: 'Nessuna immagine per OCR.',
                loadingEngine: 'Caricamento motore OCR...',
                preparingPage: 'Preparazione OCR pagina {{current}} di {{total}}...',
                runningCell: 'OCR pagina {{page}}, cella {{cell}}...',
                completeNoText: 'OCR completato: nessun testo trovato.',
                completeWithText_one: 'Testo selezionabile pronto: {{count}} riga riconosciuta.',
                completeWithText_other: 'Testo selezionabile pronto: {{count}} righe riconosciute.',
                failed: 'OCR non riuscito. Riprova.',
                noExportableCells: 'Nessuna cella esportabile trovata per OCR.'
            },
            errors: {
                prefix: 'Errore PDFomator: {{message}}',
                unexpected: 'Si è verificato un errore inatteso. Aggiorna la pagina e riprova.'
            },
            update: {
                available: 'App aggiornata. Nuova versione disponibile.',
                refresh: 'Aggiorna',
                dismiss: 'Chiudi'
            }
        }
    },
    de: {
        translation: {
            app: {
                description: 'Mobile-first PWA zum Anordnen von PDF-Seiten und Bildern auf druckbaren Blättern mit lokaler OCR'
            },
            common: {
                cancel: 'Abbrechen'
            },
            actions: {
                changePaperSize: 'Papierformat ändern',
                selectGrid: 'Raster auswählen',
                runOcr: 'OCR ausführen',
                exportPdf: 'PDF exportieren'
            },
            page: {
                controls: 'Seitensteuerung',
                previous: 'Vorherige Seite',
                next: 'Nächste Seite',
                add: 'Seite hinzufügen',
                remove: 'Aktuelle Seite entfernen',
                deleteConfirm: 'Diese Seite und ihren Inhalt löschen?'
            },
            grid: {
                title: 'Rastergröße auswählen',
                shrinkWarning_one: 'Warnung: Beim Wechsel zu einem {{cols}} × {{rows}} Raster werden {{removedCells}} Zellen entfernt.\n\nDadurch wird {{count}} Inhaltselement dauerhaft aus deinem Layout gelöscht.\n\nFortfahren?',
                shrinkWarning_other: 'Warnung: Beim Wechsel zu einem {{cols}} × {{rows}} Raster werden {{removedCells}} Zellen entfernt.\n\nDadurch werden {{count}} Inhaltselemente dauerhaft aus deinem Layout gelöscht.\n\nFortfahren?'
            },
            paper: {
                title: 'Papierformat und Ausrichtung auswählen',
                a4Portrait: 'A4 Hochformat',
                a4Landscape: 'A4 Querformat',
                a3Portrait: 'A3 Hochformat',
                a3Landscape: 'A3 Querformat'
            },
            pdfPage: {
                title: 'PDF-Seite auswählen',
                selectAria: 'PDF-Seite {{page}} auswählen',
                loading: 'Laden...',
                pageLabel: 'Seite {{page}}',
                pageErrorLabel: 'Seite {{page}} (Fehler)',
                previewUnavailable: 'Vorschau nicht verfügbar',
                processingSelected: 'Ausgewählte Seite wird verarbeitet...',
                processSelectedFailed: 'Ausgewählte Seite konnte nicht verarbeitet werden.'
            },
            export: {
                title: 'Exportqualität',
                sdTitle: 'SD (Web, Mail)',
                sdDescription: 'Kleinere Dateien',
                hdTitle: 'HD (Druck)',
                hdDescription: 'Größere Dateien',
                standardLabel: 'Standard (schnell)',
                highLabel: 'Hohe Qualität',
                noContent: 'Bitte füge Inhalt zum Exportieren hinzu.',
                exporting: 'Export in Qualität {{quality}}...',
                rasterizingPage: 'Seite {{current}} von {{total}} wird gerastert...',
                assembling: 'PDF wird zusammengesetzt...',
                preparingDownload: 'Download wird vorbereitet...',
                complete: 'Export abgeschlossen.',
                failed: 'Export fehlgeschlagen. Bitte erneut versuchen.'
            },
            fileType: {
                title: 'Inhaltstyp auswählen',
                pdf: 'PDF-Dokument',
                image: 'Bilddatei',
                camera: 'Kamera'
            },
            camera: {
                title: 'Foto aufnehmen',
                device: 'Kamera',
                capturedPreview: 'Vorschau des aufgenommenen Fotos',
                capture: 'Aufnehmen',
                usePhoto: 'Foto verwenden',
                retake: 'Neu aufnehmen',
                unavailable: 'Kamerazugriff ist nicht verfügbar. Bitte Bilddatei verwenden.',
                switchFailed: 'Kamerawechsel fehlgeschlagen. Bitte ein anderes Gerät versuchen.',
                previewNotReady: 'Kameravorschau ist noch nicht bereit. Bitte erneut versuchen.',
                captureFailed: 'Foto konnte nicht aufgenommen werden. Bitte erneut versuchen.',
                processFailed: 'Foto konnte nicht verarbeitet werden. Bitte erneut versuchen.',
                useFailed: 'Aufgenommenes Foto konnte nicht verwendet werden. Bitte erneut versuchen.',
                deviceFallback: 'Kamera {{index}}',
                photoTitle: 'Kamerafoto'
            },
            loading: {
                title: 'Laden',
                processing: 'Verarbeitung...',
                processingPdf: 'PDF wird verarbeitet...',
                processingImage: 'Bild wird verarbeitet...',
                processingPhoto: 'Foto wird verarbeitet...'
            },
            filters: {
                bitonalThreshold: '1-Bit-Schwelle',
                applyFailed: 'Filter konnte nicht angewendet werden. Bitte erneut versuchen.'
            },
            image: {
                processFailed: 'Bild konnte nicht verarbeitet werden. Bitte erneut versuchen.',
                rotateFailed: 'Bild konnte nicht gedreht werden. Bitte erneut versuchen.'
            },
            pdf: {
                jsIncomplete: 'PDF.js wurde nicht vollständig geladen. Bitte Seite aktualisieren.',
                jsLoadFailed: 'PDF-Verarbeitungsbibliothek konnte nicht geladen werden. Bitte Seite aktualisieren.',
                processFailed: 'PDF konnte nicht verarbeitet werden. Bitte erneut versuchen.',
                libraryNotLoaded: 'PDF.js-Bibliothek nicht geladen. Bitte Seite aktualisieren und erneut versuchen.'
            },
            ocr: {
                noImages: 'Keine Bilder für OCR.',
                loadingEngine: 'OCR-Engine wird geladen...',
                preparingPage: 'OCR für Seite {{current}} von {{total}} wird vorbereitet...',
                runningCell: 'OCR Seite {{page}}, Zelle {{cell}}...',
                completeNoText: 'OCR abgeschlossen: kein Text gefunden.',
                completeWithText_one: 'Auswählbarer Text bereit: {{count}} Zeile erkannt.',
                completeWithText_other: 'Auswählbarer Text bereit: {{count}} Zeilen erkannt.',
                failed: 'OCR fehlgeschlagen. Bitte erneut versuchen.',
                noExportableCells: 'Keine exportierbaren Zellen für OCR gefunden.'
            },
            errors: {
                prefix: 'PDFomator-Fehler: {{message}}',
                unexpected: 'Ein unerwarteter Fehler ist aufgetreten. Bitte Seite aktualisieren und erneut versuchen.'
            },
            update: {
                available: 'App aktualisiert. Neue Version verfügbar.',
                refresh: 'Aktualisieren',
                dismiss: 'Schließen'
            }
        }
    },
    es: {
        translation: {
            app: {
                description: 'PWA móvil para colocar páginas PDF e imágenes en hojas imprimibles con OCR local'
            },
            common: {
                cancel: 'Cancelar'
            },
            actions: {
                changePaperSize: 'Cambiar tamaño de papel',
                selectGrid: 'Seleccionar cuadrícula',
                runOcr: 'Ejecutar OCR',
                exportPdf: 'Exportar PDF'
            },
            page: {
                controls: 'Controles de página',
                previous: 'Página anterior',
                next: 'Página siguiente',
                add: 'Añadir página',
                remove: 'Eliminar página actual',
                deleteConfirm: '¿Eliminar esta página y su contenido?'
            },
            grid: {
                title: 'Seleccionar tamaño de cuadrícula',
                shrinkWarning_one: 'Aviso: cambiar a una cuadrícula {{cols}} × {{rows}} eliminará {{removedCells}} celdas.\n\nEsto eliminará permanentemente {{count}} elemento de contenido del diseño.\n\n¿Continuar?',
                shrinkWarning_other: 'Aviso: cambiar a una cuadrícula {{cols}} × {{rows}} eliminará {{removedCells}} celdas.\n\nEsto eliminará permanentemente {{count}} elementos de contenido del diseño.\n\n¿Continuar?'
            },
            paper: {
                title: 'Seleccionar tamaño y orientación del papel',
                a4Portrait: 'A4 vertical',
                a4Landscape: 'A4 horizontal',
                a3Portrait: 'A3 vertical',
                a3Landscape: 'A3 horizontal'
            },
            pdfPage: {
                title: 'Seleccionar página PDF',
                selectAria: 'Seleccionar página PDF {{page}}',
                loading: 'Cargando...',
                pageLabel: 'Página {{page}}',
                pageErrorLabel: 'Página {{page}} (error)',
                previewUnavailable: 'Vista previa no disponible',
                processingSelected: 'Procesando página seleccionada...',
                processSelectedFailed: 'No se pudo procesar la página seleccionada.'
            },
            export: {
                title: 'Calidad de exportación',
                sdTitle: 'SD (web, correo)',
                sdDescription: 'Archivos más pequeños',
                hdTitle: 'HD (impresión)',
                hdDescription: 'Archivos más grandes',
                standardLabel: 'Estándar (rápido)',
                highLabel: 'Alta calidad',
                noContent: 'Añade contenido para exportar.',
                exporting: 'Exportando en calidad {{quality}}...',
                rasterizingPage: 'Rasterizando página {{current}} de {{total}}...',
                assembling: 'Ensamblando PDF...',
                preparingDownload: 'Preparando descarga...',
                complete: 'Exportación completada.',
                failed: 'La exportación falló. Inténtalo de nuevo.'
            },
            fileType: {
                title: 'Elegir tipo de contenido',
                pdf: 'Documento PDF',
                image: 'Archivo de imagen',
                camera: 'Cámara'
            },
            camera: {
                title: 'Tomar foto',
                device: 'Cámara',
                capturedPreview: 'Vista previa de la foto capturada',
                capture: 'Capturar',
                usePhoto: 'Usar foto',
                retake: 'Repetir',
                unavailable: 'El acceso a la cámara no está disponible. Usa Archivo de imagen.',
                switchFailed: 'No se pudo cambiar de cámara. Prueba otro dispositivo.',
                previewNotReady: 'La vista previa de la cámara aún no está lista. Inténtalo de nuevo.',
                captureFailed: 'No se pudo capturar la foto. Inténtalo de nuevo.',
                processFailed: 'No se pudo procesar la foto. Inténtalo de nuevo.',
                useFailed: 'No se pudo usar la foto capturada. Inténtalo de nuevo.',
                deviceFallback: 'Cámara {{index}}',
                photoTitle: 'Foto de cámara'
            },
            loading: {
                title: 'Cargando',
                processing: 'Procesando...',
                processingPdf: 'Procesando PDF...',
                processingImage: 'Procesando imagen...',
                processingPhoto: 'Procesando foto...'
            },
            filters: {
                bitonalThreshold: 'Umbral de 1 bit',
                applyFailed: 'No se pudo aplicar el filtro. Inténtalo de nuevo.'
            },
            image: {
                processFailed: 'No se pudo procesar la imagen. Inténtalo de nuevo.',
                rotateFailed: 'No se pudo girar la imagen. Inténtalo de nuevo.'
            },
            pdf: {
                jsIncomplete: 'PDF.js no se cargó completamente. Actualiza la página.',
                jsLoadFailed: 'No se pudo cargar la biblioteca de procesamiento PDF. Actualiza la página.',
                processFailed: 'No se pudo procesar el PDF. Inténtalo de nuevo.',
                libraryNotLoaded: 'La biblioteca PDF.js no está cargada. Actualiza la página e inténtalo de nuevo.'
            },
            ocr: {
                noImages: 'No hay imágenes para OCR.',
                loadingEngine: 'Cargando motor OCR...',
                preparingPage: 'Preparando OCR página {{current}} de {{total}}...',
                runningCell: 'OCR página {{page}}, celda {{cell}}...',
                completeNoText: 'OCR completado: no se encontró texto.',
                completeWithText_one: 'Texto seleccionable listo: {{count}} línea reconocida.',
                completeWithText_other: 'Texto seleccionable listo: {{count}} líneas reconocidas.',
                failed: 'OCR falló. Inténtalo de nuevo.',
                noExportableCells: 'No se encontraron celdas exportables para OCR.'
            },
            errors: {
                prefix: 'Error de PDFomator: {{message}}',
                unexpected: 'Se produjo un error inesperado. Actualiza la página e inténtalo de nuevo.'
            },
            update: {
                available: 'App actualizada. Nueva versión disponible.',
                refresh: 'Actualizar',
                dismiss: 'Cerrar'
            }
        }
    },
    fr: {
        translation: {
            app: {
                description: 'PWA mobile pour placer des pages PDF et images sur des feuilles imprimables avec OCR local'
            },
            common: {
                cancel: 'Annuler'
            },
            actions: {
                changePaperSize: 'Changer le format papier',
                selectGrid: 'Sélectionner la grille',
                runOcr: 'Lancer l’OCR',
                exportPdf: 'Exporter le PDF'
            },
            page: {
                controls: 'Commandes de page',
                previous: 'Page précédente',
                next: 'Page suivante',
                add: 'Ajouter une page',
                remove: 'Supprimer la page actuelle',
                deleteConfirm: 'Supprimer cette page et son contenu ?'
            },
            grid: {
                title: 'Sélectionner la taille de grille',
                shrinkWarning_one: 'Attention : passer à une grille {{cols}} × {{rows}} supprimera {{removedCells}} cellules.\n\nCela supprimera définitivement {{count}} élément de contenu de votre mise en page.\n\nContinuer ?',
                shrinkWarning_other: 'Attention : passer à une grille {{cols}} × {{rows}} supprimera {{removedCells}} cellules.\n\nCela supprimera définitivement {{count}} éléments de contenu de votre mise en page.\n\nContinuer ?'
            },
            paper: {
                title: 'Sélectionner le format papier et l’orientation',
                a4Portrait: 'A4 portrait',
                a4Landscape: 'A4 paysage',
                a3Portrait: 'A3 portrait',
                a3Landscape: 'A3 paysage'
            },
            pdfPage: {
                title: 'Sélectionner une page PDF',
                selectAria: 'Sélectionner la page PDF {{page}}',
                loading: 'Chargement...',
                pageLabel: 'Page {{page}}',
                pageErrorLabel: 'Page {{page}} (erreur)',
                previewUnavailable: 'Aperçu indisponible',
                processingSelected: 'Traitement de la page sélectionnée...',
                processSelectedFailed: 'Impossible de traiter la page sélectionnée.'
            },
            export: {
                title: 'Qualité d’export',
                sdTitle: 'SD (web, mail)',
                sdDescription: 'Fichiers plus petits',
                hdTitle: 'HD (impression)',
                hdDescription: 'Fichiers plus grands',
                standardLabel: 'Standard (rapide)',
                highLabel: 'Haute qualité',
                noContent: 'Ajoutez du contenu à exporter.',
                exporting: 'Export en qualité {{quality}}...',
                rasterizingPage: 'Rasterisation de la page {{current}} sur {{total}}...',
                assembling: 'Assemblage du PDF...',
                preparingDownload: 'Préparation du téléchargement...',
                complete: 'Export terminé.',
                failed: 'Échec de l’export. Veuillez réessayer.'
            },
            fileType: {
                title: 'Choisir le type de contenu',
                pdf: 'Document PDF',
                image: 'Fichier image',
                camera: 'Appareil photo'
            },
            camera: {
                title: 'Prendre une photo',
                device: 'Appareil photo',
                capturedPreview: 'Aperçu de la photo capturée',
                capture: 'Capturer',
                usePhoto: 'Utiliser la photo',
                retake: 'Reprendre',
                unavailable: 'L’accès à l’appareil photo est indisponible. Utilisez Fichier image.',
                switchFailed: 'Impossible de changer d’appareil photo. Essayez un autre appareil.',
                previewNotReady: 'L’aperçu de l’appareil photo n’est pas encore prêt. Réessayez.',
                captureFailed: 'Impossible de capturer la photo. Réessayez.',
                processFailed: 'Impossible de traiter la photo. Réessayez.',
                useFailed: 'Impossible d’utiliser la photo capturée. Réessayez.',
                deviceFallback: 'Appareil photo {{index}}',
                photoTitle: 'Photo appareil'
            },
            loading: {
                title: 'Chargement',
                processing: 'Traitement...',
                processingPdf: 'Traitement du PDF...',
                processingImage: 'Traitement de l’image...',
                processingPhoto: 'Traitement de la photo...'
            },
            filters: {
                bitonalThreshold: 'Seuil 1 bit',
                applyFailed: 'Impossible d’appliquer le filtre. Réessayez.'
            },
            image: {
                processFailed: 'Impossible de traiter l’image. Réessayez.',
                rotateFailed: 'Impossible de faire pivoter l’image. Réessayez.'
            },
            pdf: {
                jsIncomplete: 'PDF.js n’a pas été chargé complètement. Actualisez la page.',
                jsLoadFailed: 'La bibliothèque de traitement PDF n’a pas pu être chargée. Actualisez la page.',
                processFailed: 'Impossible de traiter le PDF. Réessayez.',
                libraryNotLoaded: 'La bibliothèque PDF.js n’est pas chargée. Actualisez la page et réessayez.'
            },
            ocr: {
                noImages: 'Aucune image pour l’OCR.',
                loadingEngine: 'Chargement du moteur OCR...',
                preparingPage: 'Préparation OCR page {{current}} sur {{total}}...',
                runningCell: 'OCR page {{page}}, cellule {{cell}}...',
                completeNoText: 'OCR terminé : aucun texte trouvé.',
                completeWithText_one: 'Texte sélectionnable prêt : {{count}} ligne reconnue.',
                completeWithText_other: 'Texte sélectionnable prêt : {{count}} lignes reconnues.',
                failed: 'Échec de l’OCR. Réessayez.',
                noExportableCells: 'Aucune cellule exportable trouvée pour l’OCR.'
            },
            errors: {
                prefix: 'Erreur PDFomator : {{message}}',
                unexpected: 'Une erreur inattendue est survenue. Actualisez la page et réessayez.'
            },
            update: {
                available: 'App mise à jour. Nouvelle version disponible.',
                refresh: 'Actualiser',
                dismiss: 'Fermer'
            }
        }
    }
};

function normalizeLanguage(language) {
    if (!language) return '';

    return String(language).toLowerCase().split('-')[0];
}

function detectBrowserLanguage() {
    const candidates = navigator.languages?.length ? navigator.languages : [navigator.language];

    for (const language of candidates) {
        const normalizedLanguage = normalizeLanguage(language);
        if (SUPPORTED_LANGUAGES.includes(normalizedLanguage)) {
            return normalizedLanguage;
        }
    }

    return FALLBACK_LANGUAGE;
}

async function setupI18n() {
    const language = detectBrowserLanguage();

    if (!window.i18next?.init) {
        console.warn('[i18n] i18next unavailable, using English fallback strings');
        document.documentElement.lang = FALLBACK_LANGUAGE;
        return;
    }

    try {
        await window.i18next.init({
            resources: I18N_RESOURCES,
            lng: language,
            fallbackLng: FALLBACK_LANGUAGE,
            supportedLngs: SUPPORTED_LANGUAGES,
            interpolation: {
                escapeValue: false
            }
        });

        document.documentElement.lang = window.i18next.resolvedLanguage || language;
    } catch (error) {
        console.warn('[i18n] Failed to initialize i18next, using English fallback strings:', error);
        document.documentElement.lang = FALLBACK_LANGUAGE;
    }
}

function getNestedTranslationValue(key, language = FALLBACK_LANGUAGE) {
    return key.split('.').reduce((value, part) => (
        value && typeof value === 'object' ? value[part] : undefined
    ), I18N_RESOURCES[language]?.translation);
}

function interpolateTranslation(template, options = {}) {
    return String(template).replace(/\{\{\s*(\w+)\s*\}\}/g, (_, name) => (
        options[name] === undefined || options[name] === null ? '' : String(options[name])
    ));
}

function fallbackTranslate(key, options = {}) {
    const pluralKey = typeof options.count === 'number'
        ? `${key}_${options.count === 1 ? 'one' : 'other'}`
        : key;
    const template = getNestedTranslationValue(pluralKey)
        ?? getNestedTranslationValue(key)
        ?? key;

    return interpolateTranslation(template, options);
}

function t(key, options = {}) {
    if (window.i18next?.isInitialized) {
        return window.i18next.t(key, options);
    }

    return fallbackTranslate(key, options);
}

function getTranslatableElements(root, selector) {
    const elements = [];

    if (root?.matches?.(selector)) {
        elements.push(root);
    }

    if (root?.querySelectorAll) {
        elements.push(...root.querySelectorAll(selector));
    }

    return elements;
}

function applyDomTranslations(root = document) {
    getTranslatableElements(root, '[data-i18n]').forEach(element => {
        element.textContent = t(element.dataset.i18n);
    });

    getTranslatableElements(root, '[data-i18n-attr]').forEach(element => {
        const definitions = element.dataset.i18nAttr.split(';').map(item => item.trim()).filter(Boolean);

        definitions.forEach(definition => {
            const separatorIndex = definition.indexOf(':');
            if (separatorIndex === -1) return;

            const attributeName = definition.slice(0, separatorIndex).trim();
            const key = definition.slice(separatorIndex + 1).trim();
            if (!attributeName || !key) return;

            element.setAttribute(attributeName, t(key));
        });
    });
}

function getExportQualityLabel(quality) {
    return quality === 'HD' ? t('export.highLabel') : t('export.standardLabel');
}

// Application state
function createEmptyPageState(template = null) {
    const sourceSheet = template?.sheet || {
        paperSize: 'A4',
        orientation: 'portrait',
        width: 210,
        height: 297
    };
    const sourceGrid = template?.grid || { cols: 1, rows: 2 };

    return {
        sheet: {
            paperSize: sourceSheet.paperSize,
            orientation: sourceSheet.orientation,
            width: sourceSheet.width,
            height: sourceSheet.height
        },
        grid: {
            cols: sourceGrid.cols,
            rows: sourceGrid.rows
        },
        cells: []
    };
}

const appState = {
    pages: [createEmptyPageState()],
    currentPageIndex: 0
};

function getCurrentPageState() {
    return appState.pages[appState.currentPageIndex];
}

function pageHasContent(pageState) {
    return pageState.cells.some(isCellCustomized);
}

function pageHasExportableContent(pageState) {
    return pageState.cells.some(isCellImageContent);
}

function syncPageDimensions(pageState) {
    const size = CONFIG.paperSizes[pageState.sheet.paperSize];
    if (pageState.sheet.orientation === 'portrait') {
        pageState.sheet.width = size.width;
        pageState.sheet.height = size.height;
    } else {
        pageState.sheet.width = size.height;
        pageState.sheet.height = size.width;
    }
}

function renderCurrentPage() {
    const pageState = getCurrentPageState();
    syncPageDimensions(pageState);
    elements.sheet.className = `sheet ${pageState.sheet.paperSize.toLowerCase()}-${pageState.sheet.orientation}`;
    updatePageControls();
    updateSheetViewportMetrics();
    renderSVGSheet();
    requestAnimationFrame(syncPagePreviewMetrics);
}

function animatePageTransition(direction) {
    if (!elements.sheet || !direction) return;

    const nextClass = direction === 'next' ? 'page-transition-next' : 'page-transition-prev';
    const prevClass = direction === 'next' ? 'page-transition-prev' : 'page-transition-next';
    elements.sheet.classList.remove(prevClass);
    void elements.sheet.offsetWidth;
    elements.sheet.classList.add(nextClass);

    const handleAnimationEnd = () => {
        elements.sheet.classList.remove(nextClass);
        elements.sheet.removeEventListener('animationend', handleAnimationEnd);
    };

    elements.sheet.addEventListener('animationend', handleAnimationEnd);
}

function updatePageControls() {
    const totalPages = appState.pages.length;
    const currentPage = appState.currentPageIndex + 1;
    const hasMultiplePages = totalPages > 1;

    elements.pageControls.classList.toggle('single-page', !hasMultiplePages);
    elements.pageIndicator.textContent = `${currentPage} / ${totalPages}`;
    elements.pageIndicator.classList.toggle('hidden', !hasMultiplePages);
    elements.prevPageBtn.classList.toggle('hidden', !hasMultiplePages);
    elements.nextPageBtn.classList.toggle('hidden', !hasMultiplePages);
    elements.removePageBtn.classList.toggle('hidden', !hasMultiplePages);
    elements.prevPageBtn.disabled = !hasMultiplePages || appState.currentPageIndex === 0;
    elements.nextPageBtn.disabled = !hasMultiplePages || appState.currentPageIndex === totalPages - 1;
}

function closePageScopedUI() {
    hideBitonalPopover();
    currentTargetCell = null;
}

function updateSheetViewportMetrics() {
    if (!elements.sheetStack || !elements.mainContent || !elements.pageControls) {
        return;
    }

    const contentHeight = elements.mainContent.clientHeight;
    const controlsHeight = elements.pageControls.offsetHeight || 44;
    const stackStyles = window.getComputedStyle(elements.sheetStack);
    const gap = parseFloat(stackStyles.rowGap || stackStyles.gap || '0') || 0;
    const shadowAllowance = 12;
    const availableHeight = Math.max(160, contentHeight - controlsHeight - gap - shadowAllowance);
    elements.sheetStack.style.setProperty('--sheet-available-height', `${availableHeight}px`);
}

function syncPagePreviewMetrics() {
    if (!elements.sheet || !elements.pageControls) {
        return;
    }

    const sheetWidth = elements.sheet.getBoundingClientRect().width;
    if (sheetWidth > 0) {
        elements.pageControls.style.setProperty('--sheet-preview-width', `${sheetWidth}px`);
    }
}

function handleViewportResize() {
    hideBitonalPopover();
    updateSheetViewportMetrics();
    requestAnimationFrame(syncPagePreviewMetrics);
}

function hasBlockingOverlayOpen() {
    return !!overlayManager.currentOverlay || !elements.bitonalPopover.classList.contains('hidden');
}

function handlePageSwipeStart(event) {
    if (cropDragState.active || appState.pages.length <= 1 || hasBlockingOverlayOpen() || event.touches.length !== 1) {
        resetPageSwipeTracking();
        return;
    }

    const touch = event.touches[0];
    pageSwipeState.startX = touch.clientX;
    pageSwipeState.startY = touch.clientY;
    pageSwipeState.tracking = true;
}

function handlePageSwipeEnd(event) {
    if (cropDragState.active || !pageSwipeState.tracking || appState.pages.length <= 1 || event.changedTouches.length !== 1) {
        resetPageSwipeTracking();
        return;
    }

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - pageSwipeState.startX;
    const deltaY = touch.clientY - pageSwipeState.startY;
    resetPageSwipeTracking();

    if (Math.abs(deltaX) < 50 || Math.abs(deltaX) < Math.abs(deltaY) * 1.4) {
        return;
    }

    if (deltaX < 0) {
        goToNextPage();
    } else {
        goToPreviousPage();
    }
}

function resetPageSwipeTracking() {
    pageSwipeState.startX = 0;
    pageSwipeState.startY = 0;
    pageSwipeState.tracking = false;
}

function switchToPage(pageIndex) {
    if (pageIndex < 0 || pageIndex >= appState.pages.length || pageIndex === appState.currentPageIndex) {
        return;
    }

    const direction = pageIndex > appState.currentPageIndex ? 'next' : 'prev';
    closePageScopedUI();
    appState.currentPageIndex = pageIndex;
    renderCurrentPage();
    animatePageTransition(direction);
}

function goToPreviousPage() {
    switchToPage(appState.currentPageIndex - 1);
}

function goToNextPage() {
    switchToPage(appState.currentPageIndex + 1);
}

function addPage() {
    const pageTemplate = getCurrentPageState();
    appState.pages.push(createEmptyPageState(pageTemplate));
    switchToPage(appState.pages.length - 1);
}

function removeCurrentPage() {
    if (appState.pages.length === 1) {
        return;
    }

    const currentPage = getCurrentPageState();
    if (pageHasContent(currentPage) && !window.confirm(t('page.deleteConfirm'))) {
        return;
    }

    closePageScopedUI();
    const removedIndex = appState.currentPageIndex;
    appState.pages.splice(appState.currentPageIndex, 1);
    appState.currentPageIndex = Math.min(appState.currentPageIndex, appState.pages.length - 1);
    renderCurrentPage();
    animatePageTransition(appState.currentPageIndex < removedIndex ? 'prev' : 'next');
}

const layoutState = new Proxy({}, {
    get(_target, property) {
        return getCurrentPageState()[property];
    },
    set(_target, property, value) {
        getCurrentPageState()[property] = value;
        return true;
    },
    ownKeys() {
        return Reflect.ownKeys(getCurrentPageState());
    },
    getOwnPropertyDescriptor() {
        return {
            enumerable: true,
            configurable: true
        };
    }
});

// Configuration
const CONFIG = {
    paperSizes: {
        A4: { width: 210, height: 297 },
        A3: { width: 297, height: 420 }
    },
    maxGridSize: 5,
    pdfWorkerUrl: './vendor/pdf.worker.mjs',
    
    // Grid spacing constants (in mm)
    gridSpacing: {
        sheetPadding: { top: 10, right: 10, bottom: 10, left: 10 },
        columnGap: 5,
        rowGap: 5,
        cellPadding: 2
    },
    
    // UI constants
    ui: {
        buttonRadius: 12,           // Radius for circular buttons in SVG (mm)
        buttonStrokeWidth: 2,       // Stroke width for buttons (mm)
        buttonIconSize: 8,          // Size of button icons (mm)
        buttonFontSize: 16,         // Font size for button text
        cellStrokeWidth: 0.5,       // Stroke width for cell borders (mm)
        cropBorderStrokeWidth: 0.7, // Stroke width for editable crop borders (mm)
        cropBorderHitWidth: 6,      // Invisible hit area around crop borders (mm)
        cropCornerHitSize: 10,      // Invisible hit area around crop corners (mm)
        addButtonRadius: 12,        // Radius for add button in empty cells (mm)
        addButtonFontSize: 16       // Font size for add button
    },
    
    // Interaction constants
    interaction: {
        minScale: 0.2,              // Minimum zoom scale
        maxScale: 5,                // Maximum zoom scale
        wheelZoomSlow: 0.01,        // Slow zoom step (zoomed out)
        wheelZoomNormal: 0.05,      // Normal zoom step
        wheelZoomFast: 0.05,        // Fast zoom step (zoomed in)
        pinchDampingZoomedOut: 0.15,// Pinch damping when zoomed out
        pinchDampingNormal: 0.5,    // Normal pinch damping
        pinchDampingZoomedIn: 0.2,  // Pinch damping when zoomed in
        pinchTransitionScale: 1.0,  // Scale where damping transitions (low)
        pinchTransitionScaleHigh: 3.0, // Scale where damping transitions (high)
        minCropSize: 8,             // Minimum crop rectangle size (mm)
        cropSnapThreshold: 2        // Crop edge alignment snap distance (mm)
    },
    
    // Cache management
    cache: {
        updateCheckInterval: 60000  // Check for updates every 60 seconds
    },

    // PDF page selector virtualization
    pdfSelector: {
        thumbnailScale: 0.5,        // Small preview scale for page thumbnails
        itemHeight: 188,            // Fixed virtual row item height in px
        bufferRows: 2,              // Extra rows kept mounted above/below viewport
        maxCachedThumbnails: 48     // Rendered thumbnail canvases retained across scrolls
    },

    // Image normalization
    image: {
        maxRasterDimension: 2800    // Downscale oversized photos for faster filtering/export
    },

    // Local OCR
    ocr: {
        moduleUrl: './vendor/paddleocr/paddleocr-browser.mjs',
        wasmPaths: resolveAppAssetUrl('./vendor/paddleocr/'),
        textDetectionModelName: 'PP-OCRv6_small_det',
        textDetectionModelUrl: resolveAppAssetUrl('./vendor/paddleocr/models/PP-OCRv6_small_det_onnx_infer.tar'),
        textRecognitionModelName: 'PP-OCRv6_small_rec',
        textRecognitionModelUrl: resolveAppAssetUrl('./vendor/paddleocr/models/PP-OCRv6_small_rec_onnx_infer.tar'),
        rasterScale: 3,
        minConfidence: 0.35,
        textRecognitionBatchSize: 4,
        preloadDelayMs: 1500,
        preloadIdleTimeoutMs: 3500,
        scanSweepDurationMs: 1400,
        minScanFeedbackMs: 250,
        flashDurationMs: 2200
    }
};

// Export quality configuration
const EXPORT_QUALITY = {
    SD: { 
        scale: 4.0,        // Raster scale in px/mm, tuned for the current export pipeline
        jpegQuality: 0.8
    },
    HD: { 
        scale: 6.0,
        jpegQuality: 0.9
    }
};

const CELL_FILTERS = [
    { key: 'original', label: 'O', name: 'Original' },
    { key: 'document', label: 'A', name: 'Auto' },
    { key: 'bw', label: 'BW', name: 'B&W' },
    { key: 'bitonal', label: '1', name: '1-bit' }
];
const DEFAULT_BITONAL_THRESHOLD = 58;

function resolveAppAssetUrl(path) {
    return new URL(path, window.location.href).href;
}

// Overlay management utilities
const overlayManager = {
    currentOverlay: null,
    previousFocus: null,
    
    show(element, onShow = null) {
        if (!element) return; // Safety check
        element.classList.remove('hidden');
        
        // Store the currently focused element
        this.previousFocus = document.activeElement;
        this.currentOverlay = element;
        
        // Set focus to the overlay or first focusable element
        this.trapFocus(element);
        
        if (onShow) onShow();
    },
    
    hide(element, onHide = null) {
        if (!element) return; // Safety check
        element.classList.add('hidden');
        
        // Restore focus to previous element
        if (this.previousFocus && this.currentOverlay === element) {
            this.previousFocus.focus();
            this.previousFocus = null;
            this.currentOverlay = null;
        }
        
        if (onHide) onHide();
    },
    
    // Trap focus within the overlay
    trapFocus(overlay) {
        // Get all focusable elements
        const focusableElements = overlay.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        // Focus the first element
        firstElement.focus();
        
        if (overlay._trapFocusHandler) {
            overlay.removeEventListener('keydown', overlay._trapFocusHandler);
        }

        // Handle Tab key to trap focus
        const handleTab = (e) => {
            if (e.key !== 'Tab') return;
            
            if (e.shiftKey) {
                // Shift + Tab
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                // Tab
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        };
        
        overlay._trapFocusHandler = handleTab;
        overlay.addEventListener('keydown', handleTab);
    },
    
    // Setup click-outside-to-close behavior
    setupClickOutside(overlay, hideFunction) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                hideFunction();
            }
        });
    }
};

// DOM elements
let elements = {};
let currentTargetCell = null; // Track which cell is being filled
let pageSelectorSession = null;
let lastKnownCacheVersion = '';
let statusToastTimeoutId = null;
let activeStatusToast = null;
const filterEngineState = {
    mode: 'pending',
    processor: null,
    unavailableReason: ''
};
const ocrState = {
    enginePromise: null,
    busy: false,
    status: 'idle',
    preloadScheduled: false,
    activeCell: null,
    flashItems: [],
    flashTimeoutId: null,
    lastSummary: null,
    lastError: ''
};
const bitonalPopoverState = {
    cellIndex: null,
    anchorRect: null,
    longPressTimer: null,
    suppressNextClick: false,
    frameRequestId: null,
    applying: false,
    pendingThreshold: null
};
const pageSwipeState = {
    startX: 0,
    startY: 0,
    tracking: false
};
const cameraState = {
    stream: null,
    capturedDataUrl: null,
    devices: [],
    selectedDeviceId: ''
};
const cropDragState = {
    active: false,
    suppressNextClick: false,
    suppressClickTimeoutId: null,
    previousSheetStackTouchAction: '',
    previousSheetTouchAction: '',
    previousBodyUserSelect: ''
};

function isCellImageContent(cellData) {
    return !!cellData?.image;
}

function isCellCustomized(cellData) {
    return isCellImageContent(cellData) || hasCustomCrop(cellData);
}

function hasCustomCrop(cellData) {
    if (!cellData?.crop) return false;

    const crop = normalizeCellCrop(cellData.crop);
    return crop.top > 0 || crop.right > 0 || crop.bottom > 0 || crop.left > 0;
}

function normalizeCellCrop(crop = {}) {
    return {
        top: Math.max(0, Number(crop.top) || 0),
        right: Math.max(0, Number(crop.right) || 0),
        bottom: Math.max(0, Number(crop.bottom) || 0),
        left: Math.max(0, Number(crop.left) || 0)
    };
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function clampCellCrop(crop, contentWidth, contentHeight) {
    const normalized = normalizeCellCrop(crop);
    const minWidth = Math.min(CONFIG.interaction.minCropSize, Math.max(1, contentWidth));
    const minHeight = Math.min(CONFIG.interaction.minCropSize, Math.max(1, contentHeight));

    const maxHorizontalInset = Math.max(0, contentWidth - minWidth);
    const maxVerticalInset = Math.max(0, contentHeight - minHeight);
    const left = clamp(normalized.left, 0, maxHorizontalInset);
    const right = clamp(normalized.right, 0, Math.max(0, contentWidth - minWidth - left));
    const top = clamp(normalized.top, 0, maxVerticalInset);
    const bottom = clamp(normalized.bottom, 0, Math.max(0, contentHeight - minHeight - top));

    return { top, right, bottom, left };
}

function getContentRectFromCellBounds(cellX, cellY, cellWidth, cellHeight, cellPadding) {
    return {
        x: cellX + cellPadding,
        y: cellY + cellPadding,
        width: cellWidth - (cellPadding * 2),
        height: cellHeight - (cellPadding * 2)
    };
}

function getCroppedContentRect(cellData, contentRect) {
    const crop = clampCellCrop(cellData?.crop, contentRect.width, contentRect.height);

    return {
        x: contentRect.x + crop.left,
        y: contentRect.y + crop.top,
        width: contentRect.width - crop.left - crop.right,
        height: contentRect.height - crop.top - crop.bottom,
        crop
    };
}

function setCellCrop(cellIndex, nextCrop, contentRect) {
    const crop = clampCellCrop(nextCrop, contentRect.width, contentRect.height);
    const hasCrop = crop.top > 0 || crop.right > 0 || crop.bottom > 0 || crop.left > 0;
    let cellData = layoutState.cells[cellIndex];

    if (!cellData) {
        if (!hasCrop) return;
        cellData = {};
        layoutState.cells[cellIndex] = cellData;
    }

    if (hasCrop) {
        cellData.crop = crop;
    } else {
        delete cellData.crop;
        if (!isCellImageContent(cellData)) {
            layoutState.cells[cellIndex] = null;
        }
    }
}

function resetCellCrops() {
    for (let i = 0; i < layoutState.cells.length; i++) {
        const cellData = layoutState.cells[i];

        if (!cellData?.crop) continue;

        delete cellData.crop;
        if (!isCellImageContent(cellData)) {
            layoutState.cells[i] = null;
        }
    }
}

function intersectRects(a, b) {
    const left = Math.max(a.x, b.x);
    const top = Math.max(a.y, b.y);
    const right = Math.min(a.x + a.width, b.x + b.width);
    const bottom = Math.min(a.y + a.height, b.y + b.height);

    if (left >= right || top >= bottom) {
        return null;
    }

    return {
        x: left,
        y: top,
        width: right - left,
        height: bottom - top
    };
}

function getAspectFitRect(aspectRatio, bounds) {
    const boundsAspect = bounds.width / bounds.height;
    let width;
    let height;

    if (aspectRatio > boundsAspect) {
        width = bounds.width;
        height = width / aspectRatio;
    } else {
        height = bounds.height;
        width = height * aspectRatio;
    }

    return {
        x: bounds.x + (bounds.width - width) / 2,
        y: bounds.y + (bounds.height - height) / 2,
        width,
        height
    };
}

function getAspectFillRect(aspectRatio, bounds) {
    const boundsAspect = bounds.width / bounds.height;
    let width;
    let height;

    if (aspectRatio > boundsAspect) {
        height = bounds.height;
        width = height * aspectRatio;
    } else {
        width = bounds.width;
        height = width / aspectRatio;
    }

    return {
        x: bounds.x + (bounds.width - width) / 2,
        y: bounds.y + (bounds.height - height) / 2,
        width,
        height
    };
}

function getCellImageGeometry(cellData, contentRect) {
    if (!cellData?.image || contentRect.width <= 0 || contentRect.height <= 0) {
        return null;
    }

    const { image } = cellData;
    const imageAspect = image.width / image.height;
    const contentBounds = {
        x: contentRect.x,
        y: contentRect.y,
        width: contentRect.width,
        height: contentRect.height
    };

    if (!Number.isFinite(imageAspect) || imageAspect <= 0) {
        return {
            renderRect: contentBounds,
            visibleRect: contentBounds,
            interactionRect: contentBounds,
            preserveAspectRatio: 'xMidYMid meet'
        };
    }

    if (cellData.fillMode === 'fill') {
        return {
            renderRect: contentBounds,
            visibleRect: contentBounds,
            interactionRect: contentBounds,
            preserveAspectRatio: 'none'
        };
    }

    if (cellData.fillMode === 'cover') {
        const baseRect = getAspectFillRect(imageAspect, contentBounds);
        const transform = cellData.transform || { scale: 1, translateX: 0, translateY: 0 };
        const scale = Number.isFinite(Number(transform.scale)) ? Number(transform.scale) : 1;
        const translateX = Number(transform.translateX) || 0;
        const translateY = Number(transform.translateY) || 0;
        const width = baseRect.width * scale;
        const height = baseRect.height * scale;
        const renderRect = {
            x: contentBounds.x + contentBounds.width / 2 - width / 2 + translateX,
            y: contentBounds.y + contentBounds.height / 2 - height / 2 + translateY,
            width,
            height
        };

        return {
            renderRect,
            visibleRect: renderRect,
            interactionRect: contentBounds,
            preserveAspectRatio: 'none'
        };
    }

    return {
        renderRect: contentBounds,
        visibleRect: getAspectFitRect(imageAspect, contentBounds),
        interactionRect: contentBounds,
        preserveAspectRatio: 'xMidYMid meet'
    };
}

function beginCellImageOperation(cellData) {
    cellData.imageOperationId = (cellData.imageOperationId || 0) + 1;
    return cellData.imageOperationId;
}

function isCellImageOperationCurrent(cellData, operationId) {
    return !!cellData && cellData.imageOperationId === operationId;
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', init);

// Global error boundary
window.addEventListener('error', (event) => {
    hideLoading(); // Hide any loading states
    alert(t('errors.unexpected'));
});

// Global promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
    hideLoading(); // Hide any loading states
    alert(t('errors.unexpected'));
    event.preventDefault(); // Prevent the default browser behavior
});

async function init() {
    // Cache DOM elements
    cacheElements();

    await setupI18n();
    applyDomTranslations();
    
    // Register Service Worker for PWA functionality
    registerServiceWorker();
    
    // Setup PDF.js worker
    await setupPDFWorker();
    warmFilterEngineCapability();
    
    // Setup event listeners
    setupEventListeners();
    updateOcrButtonState();

    // Initialize the current page view
    renderCurrentPage();
    scheduleOcrEnginePreload();
}

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        let hasReloadedForServiceWorker = false;
        let shouldReloadForLocalServiceWorkerUpdate = false;
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                if (!registration) {
                    console.warn('[App] Service Worker registration unavailable');
                    return;
                }

                console.log('[App] Service Worker registered successfully:', registration.scope);
                
                // Get and display version from service worker
                getServiceWorkerVersion(registration);

                // If an update is already waiting, offer it once.
                if (registration.waiting && isLocalhost) {
                    console.log('[App] Waiting Service Worker found on localhost, applying update');
                    shouldReloadForLocalServiceWorkerUpdate = true;
                    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                } else if (registration.waiting) {
                    console.log('[App] Waiting Service Worker found');
                    showUpdateNotification(registration);
                }
                
                // Check for updates
                registration.addEventListener('updatefound', () => {
                    console.log('[App] Service Worker update found');
                    
                    const newWorker = registration.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            console.log('[App] New Service Worker state:', newWorker.state);
                            
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                if (isLocalhost) {
                                    console.log('[App] New localhost Service Worker installed, applying update');
                                    shouldReloadForLocalServiceWorkerUpdate = true;
                                    (registration.waiting || newWorker).postMessage({ type: 'SKIP_WAITING' });
                                } else {
                                    console.log('[App] New version available, waiting for user refresh');
                                    showUpdateNotification(registration);
                                }
                            }
                        });
                    }
                });
                
                // Skip aggressive polling in local development to avoid noisy update loops.
                if (!isLocalhost) {
                    setInterval(() => {
                        console.log('[App] Checking for updates...');
                        registration.update();
                    }, CONFIG.cache.updateCheckInterval); // Check every minute
                }
                
            })
            .catch(error => {
                console.error('[App] Service Worker registration failed:', error);
            });
            
        // Listen for service worker controller changes
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (hasReloadedForServiceWorker) return;
            hasReloadedForServiceWorker = true;

            if (isLocalhost) {
                console.log('[App] Service Worker controller changed on localhost');
                if (shouldReloadForLocalServiceWorkerUpdate) {
                    console.log('[App] Reloading localhost after Service Worker update');
                    window.location.reload();
                    return;
                }

                getServiceWorkerVersion();
                return;
            }

            console.log('[App] Service Worker controller changed - reloading app');
            // Reload once after the user applies an update.
            window.location.reload();
        });
    } else {
        console.log('[App] Service Worker not supported');
    }
}

function showUpdateNotification(registration) {
    if (document.querySelector('.update-notification')) {
        return;
    }

    const notification = document.createElement('div');
    notification.className = 'update-notification';

    const content = document.createElement('div');
    content.className = 'update-content';

    const message = document.createElement('span');
    message.textContent = `🔄 ${t('update.available')}`;

    const updateButton = document.createElement('button');
    updateButton.id = 'updateBtn';
    updateButton.className = 'update-btn';
    updateButton.textContent = t('update.refresh');

    const dismissButton = document.createElement('button');
    dismissButton.id = 'dismissBtn';
    dismissButton.className = 'dismiss-btn';
    dismissButton.textContent = '×';
    dismissButton.setAttribute('aria-label', t('update.dismiss'));

    content.appendChild(message);
    content.appendChild(updateButton);
    content.appendChild(dismissButton);
    notification.appendChild(content);
    
    document.body.appendChild(notification);
    
    // Auto-dismiss after 10 seconds
    const autoDismiss = setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 10000);
    
    // Handle update button click
    updateButton.addEventListener('click', () => {
        clearTimeout(autoDismiss);
        if (registration?.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
        notification.remove();
    });
    
    // Handle dismiss button click
    dismissButton.addEventListener('click', () => {
        clearTimeout(autoDismiss);
        notification.remove();
    });
    
    console.log('[App] Update notification shown');
}

async function getServiceWorkerVersion(registration = null) {
    console.log('[App] Attempting to get version from service worker');
    
    if (!('serviceWorker' in navigator)) {
        console.log('[App] Service Worker not supported');
        return;
    }

    try {
        const readyRegistration = await navigator.serviceWorker.ready;
        const resolvedRegistration = registration || readyRegistration;
        const serviceWorker = navigator.serviceWorker.controller
            || readyRegistration?.active
            || resolvedRegistration?.active
            || resolvedRegistration?.waiting
            || resolvedRegistration?.installing;

        if (!serviceWorker) {
            console.warn('[App] No service worker available for version lookup');
            return;
        }

        const messageChannel = new MessageChannel();
        
        // Promise to handle the response with timeout
        const versionPromise = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Timeout waiting for version response'));
            }, 3000);
            
            messageChannel.port1.onmessage = (event) => {
                clearTimeout(timeout);
                resolve(event.data.version);
            };
        });
        
        // Send message to service worker
        serviceWorker.postMessage(
            { type: 'GET_VERSION' },
            [messageChannel.port2]
        );
        
        const version = await versionPromise;
        lastKnownCacheVersion = version;
        console.log('[App] Received version from service worker:', version);
        updateVersionDisplay(version);
    } catch (error) {
        console.warn('[App] Failed to get version from service worker:', error);
    }
}

function updateVersionDisplay(cacheVersion) {
    const versionElement = document.getElementById('version');
    if (versionElement && cacheVersion) {
        // Extract version from cache name (e.g., 'pdfomator-v1.0.2' -> 'v1.0.2')
        lastKnownCacheVersion = cacheVersion;
        const version = cacheVersion.split('-').pop();
        const engineSuffix = filterEngineState.mode === 'gpu' ? 'g' : filterEngineState.mode === 'cpu' ? 'c' : '';
        versionElement.textContent = `${version}${engineSuffix}`;
        console.log('[App] Version displayed:', version);
    } else {
        console.log('[App] Version element not found or no cache version provided');
    }
}

function refreshVersionDisplay() {
    if (lastKnownCacheVersion) {
        updateVersionDisplay(lastKnownCacheVersion);
    }
}

function cacheElements() {
    elements = {
        sheet: document.getElementById('sheet'),
        sheetStack: document.getElementById('sheetStack'),
        pageControls: document.getElementById('pageControls'),
        prevPageBtn: document.getElementById('prevPageBtn'),
        nextPageBtn: document.getElementById('nextPageBtn'),
        addPageBtn: document.getElementById('addPageBtn'),
        removePageBtn: document.getElementById('removePageBtn'),
        pageIndicator: document.getElementById('pageIndicator'),
        mainContent: document.querySelector('.main-content'),
        sizeBtn: document.getElementById('sizeBtn'),
        gridBtn: document.getElementById('gridBtn'),
        ocrBtn: document.getElementById('ocrBtn'),
        exportBtn: document.getElementById('exportBtn'),
        pdfInput: document.getElementById('pdfInput'),
        imageInput: document.getElementById('imageInput'),
        cameraInput: document.getElementById('cameraInput'),
        gridOverlay: document.getElementById('gridOverlay'),
        gridMatrix: document.getElementById('gridMatrix'),
        gridDisplay: document.getElementById('gridDisplay'),
        cancelGrid: document.getElementById('cancelGrid'),
        sizeOverlay: document.getElementById('sizeOverlay'),
        cancelSize: document.getElementById('cancelSize'),
        fileTypeSelector: document.getElementById('fileTypeSelector'),
        selectPdfBtn: document.getElementById('selectPdfBtn'),
        selectImageBtn: document.getElementById('selectImageBtn'),
        selectCameraBtn: document.getElementById('selectCameraBtn'),
        cancelFileType: document.getElementById('cancelFileType'),
        cameraOverlay: document.getElementById('cameraOverlay'),
        cameraDeviceField: document.getElementById('cameraDeviceField'),
        cameraDeviceSelect: document.getElementById('cameraDeviceSelect'),
        cameraVideo: document.getElementById('cameraVideo'),
        cameraCapturedImage: document.getElementById('cameraCapturedImage'),
        cameraCaptureBtn: document.getElementById('cameraCaptureBtn'),
        cameraUseBtn: document.getElementById('cameraUseBtn'),
        cameraRetakeBtn: document.getElementById('cameraRetakeBtn'),
        cancelCamera: document.getElementById('cancelCamera'),
        pageSelector: document.getElementById('pageSelector'),
        pageGrid: document.getElementById('pageGrid'),
        cancelPageSelection: document.getElementById('cancelPageSelection'),
        exportOverlay: document.getElementById('exportOverlay'),
        exportSD: document.getElementById('exportSD'),
        exportHD: document.getElementById('exportHD'),
        cancelExport: document.getElementById('cancelExport'),
        loading: document.getElementById('loading'),
        bitonalPopover: document.getElementById('bitonalPopover'),
        bitonalThresholdSlider: document.getElementById('bitonalThresholdSlider')
    };
}

function showError(message) {
    alert(t('errors.prefix', { message }));
}

async function setupPDFWorker() {
    try {
        if (!pdfjsLib?.getDocument || !pdfjsLib?.GlobalWorkerOptions) {
            throw new Error('PDF.js failed to load completely');
        }

        pdfjsLib.GlobalWorkerOptions.workerSrc = CONFIG.pdfWorkerUrl;
        window.pdfjsLib = pdfjsLib;
        
    } catch (error) {
        // Show user-friendly error
        showError(t('pdf.jsLoadFailed'));
    }
}

function warmFilterEngineCapability() {
    if (filterEngineState.mode !== 'pending') {
        refreshVersionDisplay();
        return;
    }

    try {
        getWebGLFilterProcessor();
        setFilterEngineMode('gpu');
    } catch (error) {
        filterEngineState.unavailableReason = String(error);
        setFilterEngineMode('cpu');
    }
}

function setFilterEngineMode(mode) {
    filterEngineState.mode = mode;
    refreshVersionDisplay();
}

function setupEventListeners() {
    // FAB button handlers
    elements.sizeBtn.addEventListener('click', handleSizePicker);
    elements.gridBtn.addEventListener('click', handleGridPicker);
    elements.ocrBtn.addEventListener('click', handleRunOCR);
    elements.exportBtn.addEventListener('click', handleExport);
    elements.prevPageBtn.addEventListener('click', goToPreviousPage);
    elements.nextPageBtn.addEventListener('click', goToNextPage);
    elements.addPageBtn.addEventListener('click', addPage);
    elements.removePageBtn.addEventListener('click', removeCurrentPage);
    
    // File input handlers
    elements.pdfInput.addEventListener('change', handlePDFSelection);
    elements.imageInput.addEventListener('change', handleImageSelection);
    elements.cameraInput.addEventListener('change', handleCameraSelection);
    
    // File type selector handlers
    elements.selectPdfBtn.addEventListener('click', () => {
        hideFileTypeSelector();
        elements.pdfInput.click();
    });
    elements.selectImageBtn.addEventListener('click', () => {
        hideFileTypeSelector();
        elements.imageInput.click();
    });
    elements.selectCameraBtn.addEventListener('click', handleCameraOption);
    elements.cancelFileType.addEventListener('click', cancelFileTypeSelector);
    elements.cameraCaptureBtn.addEventListener('click', captureCameraFrame);
    elements.cameraUseBtn.addEventListener('click', useCapturedPhoto);
    elements.cameraRetakeBtn.addEventListener('click', resetCameraCapture);
    elements.cameraDeviceSelect.addEventListener('change', handleCameraDeviceChange);
    elements.cancelCamera.addEventListener('click', cancelCameraOverlay);
    elements.bitonalThresholdSlider.addEventListener('input', handleBitonalThresholdInput);
    
    // Export quality handlers
    elements.exportSD.addEventListener('click', () => handleQualityExport('SD'));
    elements.exportHD.addEventListener('click', () => handleQualityExport('HD'));
    elements.cancelExport.addEventListener('click', hideExportOverlay);
    
    // Cancel button handlers
    elements.cancelGrid.addEventListener('click', hideGridPicker);
    elements.cancelSize.addEventListener('click', hideSizePicker);
    
    // Page selector handlers
    elements.cancelPageSelection.addEventListener('click', hidePageSelector);
    
    // Setup overlay background click handlers
    overlayManager.setupClickOutside(elements.gridOverlay, hideGridPicker);
    overlayManager.setupClickOutside(elements.sizeOverlay, hideSizePicker);
    overlayManager.setupClickOutside(elements.exportOverlay, hideExportOverlay);
    overlayManager.setupClickOutside(elements.fileTypeSelector, cancelFileTypeSelector);
    overlayManager.setupClickOutside(elements.cameraOverlay, cancelCameraOverlay);
    overlayManager.setupClickOutside(elements.pageSelector, hidePageSelector);
    
    // Setup grid matrix
    setupGridMatrix();
    
    // Setup size options
    setupSizeOptions();
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboard);
    document.addEventListener('pointerdown', handleGlobalPointerDown, true);
    window.addEventListener('resize', handleViewportResize);
    elements.sheetStack.addEventListener('touchstart', handlePageSwipeStart, { passive: true });
    elements.sheetStack.addEventListener('touchend', handlePageSwipeEnd, { passive: true });
    elements.sheetStack.addEventListener('touchcancel', resetPageSwipeTracking, { passive: true });
}

function handleKeyboard(e) {
    const target = e.target;
    const isFormControl = target instanceof HTMLElement && (
        target.tagName === 'INPUT'
        || target.tagName === 'SELECT'
        || target.tagName === 'TEXTAREA'
        || target.isContentEditable
    );

    // ESC to close overlays
    if (e.key === 'Escape') {
        hideGridPicker();
        hideSizePicker();
        cancelFileTypeSelector();
        cancelCameraOverlay();
        hidePageSelector();
        hideExportOverlay();
        hideLoading();
        hideBitonalPopover();
    }
    
    // Ctrl/Cmd + E to export
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        handleExport();
    }

    if (!isFormControl && !e.ctrlKey && !e.metaKey && !e.altKey && appState.pages.length > 1 && !hasBlockingOverlayOpen()) {
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            goToPreviousPage();
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            goToNextPage();
        }
    }
}

function handleSizePicker() {
    showSizePicker();
}

function handleCellAdd(cellIndex) {
    currentTargetCell = cellIndex;
    showFileTypeSelector();
}

function handleGridPicker() {
    showGridPicker();
}

async function handleExport() {
    if (!appState.pages.some(pageHasExportableContent)) {
        alert(t('export.noContent'));
        return;
    }
    
    showExportOverlay();
}

async function handlePDFSelection(e) {
    const files = Array.from(e.target.files);
    const targetCell = currentTargetCell; // Store target cell to prevent race conditions
    
    if (files.length === 0 || targetCell === null) return;
    
    const file = files[0]; // Single file selection
    showLoading(t('loading.processingPdf'));
    
    try {
        await processPDFFileForCell(file, targetCell);
    } catch (error) {
        alert(t('pdf.processFailed'));
    } finally {
        hideLoading();
        elements.pdfInput.value = '';
        // Only clear currentTargetCell if it still matches our stored value
        if (currentTargetCell === targetCell) {
            currentTargetCell = null;
        }
    }
}

async function handleImageSelection(e) {
    await handleImageLikeSelection(e.target, t('loading.processingImage'), t('image.processFailed'));
}

async function handleCameraSelection(e) {
    await handleImageLikeSelection(e.target, t('loading.processingPhoto'), t('camera.processFailed'));
}

async function handleImageLikeSelection(inputElement, loadingMessage, errorMessage) {
    const files = Array.from(inputElement.files || []);
    const targetCell = currentTargetCell;

    if (files.length === 0 || targetCell === null) {
        inputElement.value = '';
        return;
    }

    showLoading(loadingMessage);

    try {
        await processImageFileForCell(files[0], targetCell);
    } catch (error) {
        alert(errorMessage);
    } finally {
        hideLoading();
        inputElement.value = '';
        if (currentTargetCell === targetCell) {
            currentTargetCell = null;
        }
    }
}

function handleCameraOption() {
    hideFileTypeSelector();

    if (shouldUseNativeCameraCapture()) {
        elements.cameraInput.click();
        return;
    }

    showCameraOverlay();
}

async function processPDFFileForCell(file, cellIndex) {
    if (!pdfjsLib?.getDocument) {
        throw new Error('PDF.js library not loaded');
    }
    
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    
    if (pdf.numPages === 1) {
        // Imported PDF pages intentionally enter the shared raster image pipeline.
        const page = await pdf.getPage(1);
        const bitmap = await renderPDFPage(page, 2, 'bitmap');
        addToSpecificCell(bitmap, `${file.name} p1`, cellIndex);
    } else {
        // Multiple pages - show page selector
        await showPDFPageSelector(pdf, file.name, cellIndex);
    }
}

async function processImageFileForCell(file, cellIndex) {
    const persistentImg = await createPersistentImageFromFile(file);
    addToSpecificCell(persistentImg, file.name, cellIndex);
}

function shouldUseNativeCameraCapture() {
    const hasCoarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    const hasTouchSupport = navigator.maxTouchPoints > 0;
    const userAgent = navigator.userAgent || '';
    const isMobileUserAgent = /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent);
    const isMobileUAData = navigator.userAgentData?.mobile === true;

    return hasCoarsePointer && hasTouchSupport && (isMobileUserAgent || isMobileUAData);
}

function loadImageFromSrc(src) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Failed to load image data'));
        image.src = src;
    });
}

async function getCachedSourceCanvas(imageData) {
    if (!imageData._sourceCanvasPromise) {
        imageData._sourceCanvasPromise = loadImageFromSrc(imageData.src).then(sourceImage => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = sourceImage.naturalWidth || sourceImage.width;
            canvas.height = sourceImage.naturalHeight || sourceImage.height;

            if (!ctx || !canvas.width || !canvas.height) {
                throw new Error('Failed to cache source image');
            }

            ctx.drawImage(sourceImage, 0, 0);
            return canvas;
        });
    }

    return imageData._sourceCanvasPromise;
}

async function createPersistentImageFromSource(src) {
    const sourceImage = await loadImageFromSrc(src);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const sourceWidth = sourceImage.naturalWidth || sourceImage.width;
    const sourceHeight = sourceImage.naturalHeight || sourceImage.height;
    const maxDimension = CONFIG.image.maxRasterDimension;
    const shouldDownscale = shouldUseNativeCameraCapture();
    const scale = shouldDownscale ? Math.min(1, maxDimension / Math.max(sourceWidth, sourceHeight)) : 1;

    canvas.width = Math.max(1, Math.round(sourceWidth * scale));
    canvas.height = Math.max(1, Math.round(sourceHeight * scale));

    if (!canvas.width || !canvas.height || !ctx) {
        throw new Error('Failed to prepare image canvas');
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(sourceImage, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/png');

    return loadImageFromSrc(dataUrl);
}

async function createPersistentImageFromFile(file) {
    const objectUrl = URL.createObjectURL(file);

    try {
        return await createPersistentImageFromSource(objectUrl);
    } finally {
        URL.revokeObjectURL(objectUrl);
    }
}

async function createPersistentImageFromDataUrl(dataUrl) {
    return createPersistentImageFromSource(dataUrl);
}

async function renderPDFPage(page, scale = 2, outputFormat = 'canvas') {
    const viewport = page.getViewport({ scale });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    await page.render({
        canvasContext: context,
        viewport: viewport
    }).promise;
    
    if (outputFormat === 'bitmap') {
        // Convert to PNG bitmap (lossless, avoid double JPEG compression)
        const dataUrl = canvas.toDataURL('image/png');
        return createPersistentImageFromDataUrl(dataUrl);
    }
    
    return canvas;
}

async function showPDFPageSelector(pdf, fileName, cellIndex) {
    const pageGrid = elements.pageGrid;
    cancelPDFPageSelectorGeneration();
    
    // Hide the initial loading overlay since we're showing the page selector
    hideLoading();
    
    // Show the page selector immediately
    showPageSelector();
    
    pageSelectorSession = {
        canceled: false,
        pageIndex: appState.currentPageIndex,
        cellIndex,
        pdf,
        fileName,
        pageGrid,
        spacer: null,
        metrics: null,
        scrollHandler: null,
        frameRequestId: null,
        resizeObserver: null,
        renderedSlots: new Map(),
        thumbnailCache: new Map(),
        thumbnailCacheOrder: [],
        pendingRenders: new Map()
    };

    setupVirtualPDFPageSelector(pageSelectorSession);
}

function setupVirtualPDFPageSelector(session) {
    const { pageGrid } = session;

    pageGrid.innerHTML = '';
    pageGrid.scrollTop = 0;
    pageGrid.classList.add('virtualized');

    const spacer = document.createElement('div');
    spacer.className = 'page-virtual-spacer';
    pageGrid.appendChild(spacer);
    session.spacer = spacer;

    session.scrollHandler = () => {
        scheduleVirtualPDFPageSelectorUpdate(session);
    };
    pageGrid.addEventListener('scroll', session.scrollHandler, { passive: true });

    if ('ResizeObserver' in window) {
        session.resizeObserver = new ResizeObserver(() => {
            scheduleVirtualPDFPageSelectorUpdate(session);
        });
        session.resizeObserver.observe(pageGrid);
    }

    updateVirtualPDFPageSelector(session);
    scheduleVirtualPDFPageSelectorUpdate(session);
}

function scheduleVirtualPDFPageSelectorUpdate(session) {
    if (session.canceled || pageSelectorSession !== session || session.frameRequestId !== null) {
        return;
    }

    session.frameRequestId = requestAnimationFrame(() => {
        session.frameRequestId = null;
        updateVirtualPDFPageSelector(session);
    });
}

function getPDFPageSelectorMetrics(pageGrid, totalPages) {
    const styles = window.getComputedStyle(pageGrid);
    const gap = parseFloat(styles.rowGap || styles.gap || '16') || 16;
    const columns = window.matchMedia('(max-width: 768px)').matches ? 1 : 2;
    const itemWidth = Math.max(0, (pageGrid.clientWidth - gap * (columns - 1)) / columns);
    const itemHeight = CONFIG.pdfSelector.itemHeight;
    const rowHeight = itemHeight + gap;
    const rowCount = Math.ceil(totalPages / columns);

    return {
        columns,
        gap,
        itemWidth,
        itemHeight,
        rowHeight,
        rowCount,
        spacerHeight: rowCount * itemHeight + Math.max(0, rowCount - 1) * gap
    };
}

function updateVirtualPDFPageSelector(session) {
    if (session.canceled || pageSelectorSession !== session) {
        return;
    }

    const { pageGrid, pdf, spacer } = session;
    const metrics = getPDFPageSelectorMetrics(pageGrid, pdf.numPages);
    session.metrics = metrics;

    spacer.style.height = `${metrics.spacerHeight}px`;

    if (metrics.itemWidth <= 0 || metrics.rowCount === 0) {
        return;
    }

    const range = getVirtualPDFPageRange(session);

    for (const [pageNum, slot] of session.renderedSlots) {
        if (pageNum < range.start || pageNum > range.end) {
            slot.remove();
            session.renderedSlots.delete(pageNum);
        }
    }

    for (let pageNum = range.start; pageNum <= range.end; pageNum++) {
        renderVirtualPDFPageSlot(session, pageNum);
    }

    prunePDFThumbnailCache(session);
}

function getVirtualPDFPageRange(session) {
    const { pageGrid, pdf, metrics } = session;
    const viewportHeight = pageGrid.clientHeight || metrics.itemHeight;
    const bufferRows = CONFIG.pdfSelector.bufferRows;
    const firstRow = Math.max(0, Math.floor(pageGrid.scrollTop / metrics.rowHeight) - bufferRows);
    const lastRow = Math.min(
        metrics.rowCount - 1,
        Math.ceil((pageGrid.scrollTop + viewportHeight) / metrics.rowHeight) + bufferRows
    );

    return {
        start: firstRow * metrics.columns + 1,
        end: Math.min(pdf.numPages, (lastRow + 1) * metrics.columns)
    };
}

function renderVirtualPDFPageSlot(session, pageNum) {
    let slot = session.renderedSlots.get(pageNum);

    if (!slot) {
        slot = createVirtualPDFPageSlot(session, pageNum);
        session.renderedSlots.set(pageNum, slot);
        session.spacer.appendChild(slot);
        renderPDFPageSlotThumbnail(session, pageNum, slot);
    }

    positionVirtualPDFPageSlot(session, pageNum, slot);
}

function createVirtualPDFPageSlot(session, pageNum) {
    const slot = document.createElement('div');
    slot.className = 'page-thumbnail page-thumbnail-virtual';
    slot.dataset.pageNum = pageNum;
    slot.tabIndex = 0;
    slot.setAttribute('role', 'button');
    slot.setAttribute('aria-label', t('pdfPage.selectAria', { page: pageNum }));

    slot.addEventListener('click', () => {
        selectPDFPageFromSession(session, pageNum);
    });

    slot.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            selectPDFPageFromSession(session, pageNum);
        }
    });

    renderPDFPageSlotPlaceholder(slot, pageNum, t('pdfPage.loading'));
    return slot;
}

function positionVirtualPDFPageSlot(session, pageNum, slot) {
    const { columns, gap, itemWidth, itemHeight, rowHeight } = session.metrics;
    const pageIndex = pageNum - 1;
    const row = Math.floor(pageIndex / columns);
    const col = pageIndex % columns;

    slot.style.width = `${itemWidth}px`;
    slot.style.height = `${itemHeight}px`;
    slot.style.transform = `translate(${col * (itemWidth + gap)}px, ${row * rowHeight}px)`;
}

function renderPDFPageSlotPlaceholder(slot, pageNum, message, isError = false) {
    slot.innerHTML = '';
    slot.classList.toggle('page-thumbnail-error', isError);

    const placeholder = document.createElement('div');
    placeholder.className = 'page-thumbnail-placeholder';
    placeholder.textContent = message;

    const label = document.createElement('div');
    label.className = 'page-label';
    label.textContent = isError
        ? t('pdfPage.pageErrorLabel', { page: pageNum })
        : t('pdfPage.pageLabel', { page: pageNum });

    slot.appendChild(placeholder);
    slot.appendChild(label);
}

function renderPDFPageSlotCanvas(slot, pageNum, canvas) {
    slot.innerHTML = '';
    slot.classList.remove('page-thumbnail-error');

    const label = document.createElement('div');
    label.className = 'page-label';
    label.textContent = t('pdfPage.pageLabel', { page: pageNum });

    slot.appendChild(canvas);
    slot.appendChild(label);
}

async function renderPDFPageSlotThumbnail(session, pageNum, slot) {
    const cachedThumbnail = session.thumbnailCache.get(pageNum);

    if (cachedThumbnail) {
        touchPDFThumbnailCacheEntry(session, pageNum);
        if (cachedThumbnail.error) {
            renderPDFPageSlotPlaceholder(slot, pageNum, t('pdfPage.previewUnavailable'), true);
        } else {
            renderPDFPageSlotCanvas(slot, pageNum, cachedThumbnail.canvas);
        }
        return;
    }

    if (session.pendingRenders.has(pageNum)) {
        return;
    }

    const renderPromise = (async () => {
        try {
            const page = await session.pdf.getPage(pageNum);
            const canvas = await renderPDFPage(page, CONFIG.pdfSelector.thumbnailScale, 'canvas');

            if (session.canceled || pageSelectorSession !== session) {
                return;
            }

            cachePDFThumbnail(session, pageNum, { canvas });

            const currentSlot = session.renderedSlots.get(pageNum);
            if (currentSlot?.isConnected) {
                renderPDFPageSlotCanvas(currentSlot, pageNum, canvas);
            }
        } catch (error) {
            if (session.canceled || pageSelectorSession !== session) {
                return;
            }

            cachePDFThumbnail(session, pageNum, { error: true });

            const currentSlot = session.renderedSlots.get(pageNum);
            if (currentSlot?.isConnected) {
                renderPDFPageSlotPlaceholder(currentSlot, pageNum, t('pdfPage.previewUnavailable'), true);
            }
        } finally {
            session.pendingRenders.delete(pageNum);
            prunePDFThumbnailCache(session);
        }
    })();

    session.pendingRenders.set(pageNum, renderPromise);
}

function cachePDFThumbnail(session, pageNum, entry) {
    session.thumbnailCache.set(pageNum, entry);
    touchPDFThumbnailCacheEntry(session, pageNum);
    prunePDFThumbnailCache(session);
}

function touchPDFThumbnailCacheEntry(session, pageNum) {
    const existingIndex = session.thumbnailCacheOrder.indexOf(pageNum);
    if (existingIndex !== -1) {
        session.thumbnailCacheOrder.splice(existingIndex, 1);
    }
    session.thumbnailCacheOrder.push(pageNum);
}

function prunePDFThumbnailCache(session) {
    const visiblePages = new Set(session.renderedSlots.keys());
    let attempts = 0;

    while (session.thumbnailCacheOrder.length > CONFIG.pdfSelector.maxCachedThumbnails && attempts < session.thumbnailCacheOrder.length) {
        const pageNum = session.thumbnailCacheOrder[0];

        if (visiblePages.has(pageNum)) {
            session.thumbnailCacheOrder.push(session.thumbnailCacheOrder.shift());
            attempts++;
            continue;
        }

        session.thumbnailCache.delete(pageNum);
        session.thumbnailCacheOrder.shift();
        attempts = 0;
    }
}

function selectPDFPageFromSession(session, pageNum) {
    if (session.canceled || pageSelectorSession !== session) {
        return;
    }

    const { pdf, fileName, pageIndex, cellIndex } = session;
    cancelPDFPageSelectorGeneration();
    overlayManager.hide(elements.pageSelector);
    showLoading(t('pdfPage.processingSelected'));
    processSelectedPage(pdf, pageNum, fileName, pageIndex, cellIndex);
}

function cancelPDFPageSelectorGeneration() {
    if (pageSelectorSession) {
        cleanupPDFPageSelectorSession(pageSelectorSession);
        pageSelectorSession = null;
    }
}

function cleanupPDFPageSelectorSession(session) {
    session.canceled = true;

    if (session.frameRequestId !== null) {
        cancelAnimationFrame(session.frameRequestId);
        session.frameRequestId = null;
    }

    if (session.pageGrid && session.scrollHandler) {
        session.pageGrid.removeEventListener('scroll', session.scrollHandler);
        session.scrollHandler = null;
    }

    if (session.resizeObserver) {
        session.resizeObserver.disconnect();
        session.resizeObserver = null;
    }

    if (session.pageGrid) {
        session.pageGrid.classList.remove('virtualized');
        session.pageGrid.innerHTML = '';
    }

    session.renderedSlots?.clear();
    session.thumbnailCache?.clear();
    session.thumbnailCacheOrder = [];
    session.pendingRenders?.clear();
}

async function processSelectedPage(pdf, pageNum, fileName, pageIndex, cellIndex) {
    const originalPageIndex = appState.currentPageIndex;

    try {
        const selectedPage = await pdf.getPage(pageNum);
        const bitmap = await renderPDFPage(selectedPage, 2, 'bitmap');
        appState.currentPageIndex = pageIndex;
        addToSpecificCell(bitmap, `${fileName} p${pageNum}`, cellIndex);
    } catch (error) {
        alert(t('pdfPage.processSelectedFailed'));
    } finally {
        appState.currentPageIndex = originalPageIndex;
        renderCurrentPage();
        hideLoading();
    }
}

function addToSpecificCell(content, title = '', cellIndex) {
    const existingCell = layoutState.cells[cellIndex];
    const existingCrop = normalizeCellCrop(existingCell?.crop);
    const imageData = {
        src: content.src,
        width: content.naturalWidth,
        height: content.naturalHeight
    };

    // Store image data in new format for SVG compatibility
    const nextCellData = {
        image: imageData,
        originalImage: imageData,
        title,
        filter: 'original',
        filterSettings: {
            bitonalThreshold: DEFAULT_BITONAL_THRESHOLD
        },
        imageOperationId: 0,
        fillMode: 'contain', // Default fill mode
        transform: {
            scale: 1,
            translateX: 0,
            translateY: 0
        }
    };

    if (hasCustomCrop({ crop: existingCrop })) {
        nextCellData.crop = existingCrop;
    }

    layoutState.cells[cellIndex] = nextCellData;
    
    // Re-render entire SVG sheet
    renderSVGSheet();
}

function removeCellContent(cellIndex) {
    if (bitonalPopoverState.cellIndex === cellIndex) {
        hideBitonalPopover();
    }
    const existingCell = layoutState.cells[cellIndex];
    const existingCrop = normalizeCellCrop(existingCell?.crop);
    layoutState.cells[cellIndex] = hasCustomCrop({ crop: existingCrop })
        ? { crop: existingCrop }
        : null;
    // Re-render entire SVG sheet
    renderSVGSheet();
}

function cycleFillMode(cellIndex) {
    const cellData = layoutState.cells[cellIndex];
    if (!cellData) return;
    
    // SVG native fill mode values to cycle through
    const fillModes = ['contain', 'cover', 'fill'];
    const currentMode = cellData.fillMode || 'contain';
    const currentIndex = fillModes.indexOf(currentMode);
    const nextIndex = (currentIndex + 1) % fillModes.length;
    const nextMode = fillModes[nextIndex];
    
    // Update state
    cellData.fillMode = nextMode;
    
    // Reset transform when switching fill modes
    if (!cellData.transform) {
        cellData.transform = { scale: 1, translateX: 0, translateY: 0 };
    } else {
        cellData.transform.scale = 1;
        cellData.transform.translateX = 0;
        cellData.transform.translateY = 0;
    }
    
    // Re-render entire SVG sheet
    renderSVGSheet();
}

async function cycleCellFilter(cellIndex) {
    const cellData = layoutState.cells[cellIndex];
    if (!cellData?.image) return;

    const currentFilter = cellData.filter || 'original';
    const currentIndex = CELL_FILTERS.findIndex(filter => filter.key === currentFilter);
    const nextFilter = CELL_FILTERS[(currentIndex + 1 + CELL_FILTERS.length) % CELL_FILTERS.length];

    try {
        await applyCellFilter(cellIndex, nextFilter.key);
    } catch (error) {
        console.error('Failed to apply filter:', error);
        alert(t('filters.applyFailed'));
    }
}

async function applyCellFilter(cellIndex, filterKey) {
    const cellData = layoutState.cells[cellIndex];
    if (!cellData?.image) return;

    if (bitonalPopoverState.cellIndex === cellIndex && filterKey !== 'bitonal') {
        hideBitonalPopover();
    }

    const originalImage = cellData.originalImage || cellData.image;
    const operationId = beginCellImageOperation(cellData);
    cellData.originalImage = originalImage;
    cellData.filterSettings = cellData.filterSettings || { bitonalThreshold: DEFAULT_BITONAL_THRESHOLD };
    cellData.filter = filterKey;

    if (filterKey === 'original') {
        if (!isCellImageOperationCurrent(cellData, operationId)) return;
        cellData.image = originalImage;
        updateSingleCell(cellIndex);
        return;
    }

    const filteredImage = await applyWebGLFilterToImage(originalImage, filterKey, cellData.filterSettings);
    if (!isCellImageOperationCurrent(cellData, operationId)) return;

    cellData.image = filteredImage;
    updateSingleCell(cellIndex);
}

// Rotate image 90 degrees clockwise
function rotateImage(cellIndex) {
    const cellData = layoutState.cells[cellIndex];
    if (!cellData?.image) return;
    
    // Ensure transform exists (backward compatibility)
    if (!cellData.transform) {
        cellData.transform = { scale: 1, translateX: 0, translateY: 0 };
    }
    
    const originalImage = cellData.originalImage || cellData.image;
    const operationId = beginCellImageOperation(cellData);

    // Rotate the actual source image data, then rebuild the filtered version.
    rotateImageData(originalImage).then(async rotatedImageData => {
        if (!isCellImageOperationCurrent(cellData, operationId)) return;

        cellData.originalImage = rotatedImageData;
        cellData.filterSettings = cellData.filterSettings || { bitonalThreshold: DEFAULT_BITONAL_THRESHOLD };
        cellData.filter = cellData.filter || 'original';

        if (cellData.filter === 'original') {
            cellData.image = rotatedImageData;
        } else {
            const filteredImage = await applyWebGLFilterToImage(rotatedImageData, cellData.filter, cellData.filterSettings);
            if (!isCellImageOperationCurrent(cellData, operationId)) return;
            cellData.image = filteredImage;
        }

        // Reset transforms since we've physically rotated the image
        cellData.transform.scale = 1;
        cellData.transform.translateX = 0;
        cellData.transform.translateY = 0;
        
        // Re-render the sheet to show the rotation
        renderSVGSheet();
    }).catch(error => {
        console.error('Failed to rotate image:', error);
        alert(t('image.rotateFailed'));
    });
}

// Function to rotate image data 90 degrees clockwise
async function rotateImageData(imageData) {
    return new Promise((resolve, reject) => {
        try {
            // Create a canvas with swapped dimensions (90° rotation)
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Swap width and height for 90° rotation
            canvas.width = imageData.height;
            canvas.height = imageData.width;
            
            // Apply rotation transform
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(Math.PI / 2); // 90 degrees in radians
            ctx.translate(-imageData.width / 2, -imageData.height / 2);
            
            // Create image element from existing data
            const img = new Image();
            img.onload = () => {
                try {
                    // Draw the rotated image
                    ctx.drawImage(img, 0, 0, imageData.width, imageData.height);
                    
                    // Convert back to data URL (PNG for lossless quality preservation)
                    const rotatedDataURL = canvas.toDataURL('image/png');
                    
                    // Create new image object with rotated data
                    const rotatedImg = new Image();
                    rotatedImg.onload = () => {
                        resolve({
                            src: rotatedDataURL,
                            width: rotatedImg.naturalWidth,
                            height: rotatedImg.naturalHeight
                        });
                    };
                    rotatedImg.onerror = () => reject(new Error('Failed to create rotated image'));
                    rotatedImg.src = rotatedDataURL;
                    
                } catch (error) {
                    reject(error);
                }
            };
            img.onerror = () => reject(new Error('Failed to load image for rotation'));
            img.src = imageData.src;
            
        } catch (error) {
            reject(error);
        }
    });
}

function getFilterModeValue(filterKey) {
    switch (filterKey) {
        case 'document':
            return 1;
        case 'bw':
            return 2;
        case 'bitonal':
            return 3;
        default:
            return 0;
    }
}

function getBitonalThreshold(cellData) {
    return cellData?.filterSettings?.bitonalThreshold ?? DEFAULT_BITONAL_THRESHOLD;
}

function getCellFilterConfig(filterKey) {
    return CELL_FILTERS.find(filter => filter.key === filterKey) || CELL_FILTERS[0];
}

async function applyWebGLFilterToImage(imageData, filterKey, filterSettings = null) {
    const sourceCanvas = await getCachedSourceCanvas(imageData);

    try {
        const filteredDataUrl = renderFilteredImageWebGL(sourceCanvas, filterKey, filterSettings);
        setFilterEngineMode('gpu');
        return createPersistentImageFromDataUrl(filteredDataUrl);
    } catch (error) {
        console.warn('WebGL filter fallback triggered:', error);
        filterEngineState.unavailableReason = String(error);
        setFilterEngineMode('cpu');
        return renderFilteredImage2D(sourceCanvas, filterKey, filterSettings);
    }
}

function renderFilteredImageWebGL(sourceImage, filterKey, filterSettings = null) {
    const processor = getWebGLFilterProcessor();
    return processor.render(sourceImage, getFilterModeValue(filterKey), (filterSettings?.bitonalThreshold ?? DEFAULT_BITONAL_THRESHOLD) / 100);
}

async function renderFilteredImage2D(sourceImage, filterKey, filterSettings = null) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = sourceImage.naturalWidth || sourceImage.width;
    canvas.height = sourceImage.naturalHeight || sourceImage.height;

    if (!ctx || !canvas.width || !canvas.height) {
        throw new Error('2D canvas unavailable');
    }

    ctx.drawImage(sourceImage, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    const bitonalThreshold = (filterSettings?.bitonalThreshold ?? DEFAULT_BITONAL_THRESHOLD) / 100;

    for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i] / 255;
        const g = pixels[i + 1] / 255;
        const b = pixels[i + 2] / 255;
        const luma = (r * 0.299) + (g * 0.587) + (b * 0.114);

        let outR = r;
        let outG = g;
        let outB = b;

        if (filterKey === 'document') {
            outR = Math.min(1, Math.max(0, ((r * 0.65 + luma * 0.35) - 0.5) * 1.55 + 0.54));
            outG = Math.min(1, Math.max(0, ((g * 0.65 + luma * 0.35) - 0.5) * 1.55 + 0.54));
            outB = Math.min(1, Math.max(0, ((b * 0.65 + luma * 0.35) - 0.5) * 1.55 + 0.54));
        } else if (filterKey === 'bw') {
            const gray = Math.min(1, Math.max(0, (luma - 0.5) * 1.5 + 0.5));
            outR = gray;
            outG = gray;
            outB = gray;
        } else if (filterKey === 'bitonal') {
            const binary = ((luma - 0.48) * 2.4 + 0.5) >= bitonalThreshold ? 1 : 0;
            outR = binary;
            outG = binary;
            outB = binary;
        }

        pixels[i] = Math.round(outR * 255);
        pixels[i + 1] = Math.round(outG * 255);
        pixels[i + 2] = Math.round(outB * 255);
    }

    ctx.putImageData(imageData, 0, 0);
    return createPersistentImageFromDataUrl(canvas.toDataURL('image/png'));
}

function compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const error = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(error || 'Shader compilation failed');
    }

    return shader;
}

function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const error = gl.getProgramInfoLog(program);
        gl.deleteProgram(program);
        throw new Error(error || 'Program linking failed');
    }

    return program;
}

function getWebGLFilterProcessor() {
    if (filterEngineState.processor) {
        return filterEngineState.processor;
    }

    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl', { premultipliedAlpha: false, preserveDrawingBuffer: true });
    if (!gl) {
        throw new Error('WebGL unavailable');
    }

    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, `
        attribute vec2 a_position;
        attribute vec2 a_texCoord;
        varying vec2 v_texCoord;

        void main() {
            gl_Position = vec4(a_position, 0.0, 1.0);
            v_texCoord = a_texCoord;
        }
    `);

    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, `
        precision mediump float;
        varying vec2 v_texCoord;
        uniform sampler2D u_image;
        uniform float u_filterMode;
        uniform float u_bitonalThreshold;

        float luminance(vec3 color) {
            return dot(color, vec3(0.299, 0.587, 0.114));
        }

        void main() {
            vec4 sampleColor = texture2D(u_image, v_texCoord);
            vec3 color = sampleColor.rgb;
            float luma = luminance(color);

            if (u_filterMode < 0.5) {
                gl_FragColor = sampleColor;
                return;
            }

            if (u_filterMode < 1.5) {
                vec3 balanced = mix(color, vec3(luma), 0.35);
                balanced = clamp((balanced - 0.5) * 1.55 + 0.54, 0.0, 1.0);
                balanced = smoothstep(vec3(0.04), vec3(0.96), balanced);
                gl_FragColor = vec4(balanced, sampleColor.a);
                return;
            }

            if (u_filterMode < 2.5) {
                float gray = clamp((luma - 0.5) * 1.5 + 0.5, 0.0, 1.0);
                gl_FragColor = vec4(vec3(gray), sampleColor.a);
                return;
            }

            float contrasted = clamp((luma - 0.48) * 2.4 + 0.5, 0.0, 1.0);
            float binary = step(u_bitonalThreshold, contrasted);
            gl_FragColor = vec4(vec3(binary), sampleColor.a);
        }
    `);

    const program = createProgram(gl, vertexShader, fragmentShader);
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
        -1,  1,
         1, -1,
         1,  1
    ]), gl.STATIC_DRAW);

    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0, 1,
        1, 1,
        0, 0,
        0, 0,
        1, 1,
        1, 0
    ]), gl.STATIC_DRAW);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    gl.useProgram(program);

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

    const imageLocation = gl.getUniformLocation(program, 'u_image');
    gl.uniform1i(imageLocation, 0);
    const filterLocation = gl.getUniformLocation(program, 'u_filterMode');
    const bitonalThresholdLocation = gl.getUniformLocation(program, 'u_bitonalThreshold');

    const processor = {
        gl,
        canvas,
        program,
        vertexShader,
        fragmentShader,
        positionBuffer,
        texCoordBuffer,
        texture,
        filterLocation,
        bitonalThresholdLocation,
        render(sourceImage, filterModeValue, bitonalThreshold) {
            const width = sourceImage.width || sourceImage.naturalWidth;
            const height = sourceImage.height || sourceImage.naturalHeight;
            canvas.width = width;
            canvas.height = height;
            gl.viewport(0, 0, width, height);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sourceImage);
            gl.uniform1f(filterLocation, filterModeValue);
            gl.uniform1f(bitonalThresholdLocation, bitonalThreshold);
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
            return canvas.toDataURL('image/png');
        },
        destroy() {
            gl.bindTexture(gl.TEXTURE_2D, null);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            gl.useProgram(null);
            gl.deleteTexture(texture);
            gl.deleteBuffer(positionBuffer);
            gl.deleteBuffer(texCoordBuffer);
            gl.deleteProgram(program);
            gl.deleteShader(vertexShader);
            gl.deleteShader(fragmentShader);
        }
    };

    canvas.addEventListener('webglcontextlost', () => {
        filterEngineState.processor = null;
        setFilterEngineMode('cpu');
    }, { once: true });

    filterEngineState.processor = processor;
    return processor;
}

// Interactive image transform functions for cover mode
function setupImageInteraction(imageEl, cellIndex, cellBounds) {
    try {
        const cellData = layoutState.cells[cellIndex];
        if (!cellData || cellData.fillMode !== 'cover') return;
        
        // Ensure transform exists (backward compatibility)
        if (!cellData.transform) {
            cellData.transform = { scale: 1, translateX: 0, translateY: 0 };
        }
        
        let isInteracting = false;
        let startTouches = [];
        let startTransform = { ...cellData.transform };
        let mouseDragMoved = false;
        
        // Handle click for desktop fill mode cycling
        imageEl.addEventListener('click', (e) => {
            e.stopPropagation();
            if (mouseDragMoved) {
                mouseDragMoved = false;
                return;
            }
            // Only handle click on desktop (no touch support)
            if (!('ontouchstart' in window) && !isInteracting) {
                cycleFillMode(cellIndex);
            }
        });
        
        // Mouse events for desktop
        imageEl.addEventListener('mousedown', startInteraction);
        imageEl.addEventListener('wheel', handleWheel, { passive: false });
        
        // Touch events for mobile - simplified
        imageEl.addEventListener('touchstart', handleTouchStart, { passive: false });
        imageEl.addEventListener('touchmove', handleTouchMove, { passive: false });
        imageEl.addEventListener('touchend', handleTouchEnd, { passive: false });
        imageEl.addEventListener('touchcancel', handleTouchEnd, { passive: false });
    
    function handleTouchStart(e) {
        e.preventDefault();
        e.stopPropagation();
        
        isInteracting = true;
        
        startTouches = Array.from(e.touches).map(touch => ({
            x: touch.clientX,
            y: touch.clientY,
            identifier: touch.identifier
        }));
        
        // Capture the current transform state at the start of interaction
        startTransform = { ...cellData.transform };
    }
    
    function handleTouchMove(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if (!isInteracting) return;
        
        const currentTouches = Array.from(e.touches);
        
        if (currentTouches.length === 1 && startTouches.length === 1) {
            // Single finger pan
            const startTouch = startTouches[0];
            const currentTouch = currentTouches.find(touch => touch.identifier === startTouch.identifier) || currentTouches[0];
            
            const deltaX = currentTouch.clientX - startTouch.x;
            const deltaY = currentTouch.clientY - startTouch.y;
            
            updateTransform(deltaX, deltaY, 1);
            
        } else if (currentTouches.length === 2 && startTouches.length >= 1) {
            // Two finger pinch-to-zoom
            if (startTouches.length === 1) {
                // We started with one finger, now have two - update start touches
                startTouches = Array.from(e.touches).map(touch => ({
                    x: touch.clientX,
                    y: touch.clientY,
                    identifier: touch.identifier
                }));
                startTransform = { ...cellData.transform };
                return;
            }
            
            // Match touches by identifier
            const currentTouch1 = currentTouches.find(touch => touch.identifier === startTouches[0].identifier);
            const currentTouch2 = currentTouches.find(touch => touch.identifier === startTouches[1].identifier);
            
            if (currentTouch1 && currentTouch2 && startTouches.length >= 2) {
                const startDistance = getDistance(startTouches[0], startTouches[1]);
                const currentDistance = getDistance(
                    { x: currentTouch1.clientX, y: currentTouch1.clientY },
                    { x: currentTouch2.clientX, y: currentTouch2.clientY }
                );
                const scaleChange = currentDistance / startDistance;
                
                // Get center point of the gesture
                const startCenter = getCenter(startTouches[0], startTouches[1]);
                const currentCenter = getCenter(
                    { x: currentTouch1.clientX, y: currentTouch1.clientY },
                    { x: currentTouch2.clientX, y: currentTouch2.clientY }
                );
                const deltaX = currentCenter.x - startCenter.x;
                const deltaY = currentCenter.y - startCenter.y;
                
                updateTransform(deltaX, deltaY, scaleChange);
            }
        }
    }
    
    function handleTouchEnd(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // If all touches are gone, end interaction
        if (e.touches.length === 0) {
            isInteracting = false;
            startTouches = [];
        } else if (e.touches.length < startTouches.length) {
            // Some touches lifted, update the remaining touches as new start
            startTouches = Array.from(e.touches).map(touch => ({
                x: touch.clientX,
                y: touch.clientY,
                identifier: touch.identifier
            }));
            startTransform = { ...cellData.transform };
        }
    }
    
    function startInteraction(e) {
        e.preventDefault();
        e.stopPropagation();
        
        isInteracting = true;
        startTouches = [{ x: e.clientX, y: e.clientY }];
        startTransform = { ...cellData.transform };
        mouseDragMoved = false;
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', endInteraction);
    }
    
    function handleMouseMove(e) {
        if (!isInteracting || startTouches.length !== 1) return;
        
        const deltaX = e.clientX - startTouches[0].x;
        const deltaY = e.clientY - startTouches[0].y;

        if (Math.hypot(deltaX, deltaY) > 3) {
            mouseDragMoved = true;
        }
        
        updateTransform(deltaX, deltaY, 1);
    }
    
    function endInteraction() {
        isInteracting = false;
        startTouches = [];
        
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', endInteraction);
    }
    
    function handleWheel(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const currentScale = cellData.transform.scale;
        
        // Non-linear zoom that slows down at extremes
        // Use different acceleration based on current zoom level
        let zoomStep;
        if (currentScale < CONFIG.interaction.pinchTransitionScale) {
            // Much slower zoom when zoomed out (0.2 - 1.0) for precise control
            zoomStep = CONFIG.interaction.wheelZoomSlow + (currentScale - CONFIG.interaction.minScale) * 0.025;
        } else if (currentScale > CONFIG.interaction.pinchTransitionScaleHigh) {
            // Much slower zoom when highly zoomed in (3.0 - 5.0)
            zoomStep = CONFIG.interaction.wheelZoomNormal - (currentScale - CONFIG.interaction.pinchTransitionScaleHigh) * 0.015;
        } else {
            // Normal zoom in the middle range (1.0 - 3.0)
            zoomStep = CONFIG.interaction.wheelZoomNormal;
        }
        
        const direction = e.deltaY < 0 ? 1 : -1;
        const newScale = Math.max(CONFIG.interaction.minScale, Math.min(CONFIG.interaction.maxScale, currentScale + (direction * zoomStep)));
        
        cellData.transform.scale = newScale;
        
        // Only update the specific cell, not the entire sheet
        updateSingleCell(cellIndex);
    }
    
    function updateTransform(deltaX, deltaY, scaleChange) {
        try {
            // Convert screen coordinates to SVG coordinates
            const svg = elements.sheet.querySelector('svg');
            if (!svg) return;
            
            const rect = svg.getBoundingClientRect();
            const svgDeltaX = (deltaX / rect.width) * layoutState.sheet.width;
            const svgDeltaY = (deltaY / rect.height) * layoutState.sheet.height;
            
            // Apply non-linear scaling similar to wheel zoom for pinch gestures
            let newScale;
            if (scaleChange !== 1) {
                // For pinch gestures, convert multiplicative change to additive with non-linear steps
                const currentScale = startTransform.scale;
                const scaleDelta = (scaleChange - 1) * currentScale;
                
                // Apply non-linear damping based on current zoom level
                let dampingFactor;
                if (currentScale < CONFIG.interaction.pinchTransitionScale) {
                    // Much slower scaling when zoomed out for precise control
                    dampingFactor = CONFIG.interaction.pinchDampingZoomedOut + (currentScale - CONFIG.interaction.minScale) * 0.25;
                } else if (currentScale > CONFIG.interaction.pinchTransitionScaleHigh) {
                    // Much slower scaling when highly zoomed in
                    dampingFactor = CONFIG.interaction.pinchDampingNormal - (currentScale - CONFIG.interaction.pinchTransitionScaleHigh) * 0.15;
                } else {
                    // Normal scaling in middle range
                    dampingFactor = CONFIG.interaction.pinchDampingNormal;
                }
                
                newScale = Math.max(CONFIG.interaction.minScale, Math.min(CONFIG.interaction.maxScale, currentScale + (scaleDelta * dampingFactor)));
            } else {
                newScale = startTransform.scale;
            }
            
            const newTranslateX = startTransform.translateX + svgDeltaX;
            const newTranslateY = startTransform.translateY + svgDeltaY;
            
            // Update transform
            cellData.transform = {
                scale: newScale,
                translateX: newTranslateX,
                translateY: newTranslateY
            };
            
            // Only update the specific cell, not the entire sheet
            updateSingleCell(cellIndex);
        } catch (error) {
            console.error('Cover mode: Error updating transform', error);
        }
    }
    
    function getDistance(touch1, touch2) {
        const dx = touch2.x - touch1.x;
        const dy = touch2.y - touch1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    function getCenter(touch1, touch2) {
        return {
            x: (touch1.x + touch2.x) / 2,
            y: (touch1.y + touch2.y) / 2
        };
    }
    } catch (error) {
        // Silently handle setup errors
    }
}

// Efficient single cell update function for smooth interactions
function updateSingleCell(cellIndex) {
    const svg = elements.sheet.querySelector('svg');
    if (!svg) {
        // Fallback to full render if SVG doesn't exist
        renderSVGSheet();
        return;
    }
    
    const contentLayer = svg.querySelector('#content-layer');
    const uiLayer = svg.querySelector('#ui-layer');
    
    if (!contentLayer || !uiLayer) {
        // Fallback to full render if layers don't exist
        renderSVGSheet();
        return;
    }

    const { gridSpacing } = getGridMetrics();
    const { x: cellX, y: cellY, width: cellWidth, height: cellHeight } = getCellCoordinates(cellIndex);
    
    // Find and remove existing cell elements
    const existingContentCell = contentLayer.querySelector(`[data-cell-index="${cellIndex}"]`);
    const existingUICell = uiLayer.querySelector(`[data-cell-index="${cellIndex}"]`);
    
    if (existingContentCell) existingContentCell.remove();
    if (existingUICell) existingUICell.remove();
    
    // Create new cell groups
    const cellContentGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    cellContentGroup.setAttribute('data-cell-index', cellIndex);
    cellContentGroup.setAttribute('class', 'cell-content');
    
    const cellUIGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    cellUIGroup.setAttribute('data-cell-index', cellIndex);
    cellUIGroup.setAttribute('class', 'cell-ui');
    cellUIGroup.style.cursor = 'pointer';
    
    // Render the updated cell
    renderSVGCell(cellContentGroup, cellUIGroup, cellIndex, cellX, cellY, cellWidth, cellHeight, gridSpacing.cellPadding);

    // Match the behavior of the full SVG render.
    cellUIGroup.addEventListener('click', (event) => handleCellUIClick(event, cellIndex));
    
    // Add back to DOM
    contentLayer.appendChild(cellContentGroup);
    uiLayer.appendChild(cellUIGroup);
}

function updateSheetSize() {
    renderCurrentPage();
}

function handleCellUIClick(event, cellIndex) {
    if (cropDragState.suppressNextClick) {
        event.stopPropagation();
        cropDragState.suppressNextClick = false;
        return;
    }

    handleCellAdd(cellIndex);
}

function suppressNextCellClick() {
    cropDragState.suppressNextClick = true;

    if (cropDragState.suppressClickTimeoutId) {
        clearTimeout(cropDragState.suppressClickTimeoutId);
    }

    cropDragState.suppressClickTimeoutId = setTimeout(() => {
        cropDragState.suppressNextClick = false;
        cropDragState.suppressClickTimeoutId = null;
    }, 150);
}

function getClientPointInSVG(svg, clientX, clientY) {
    const matrix = svg.getScreenCTM();

    if (matrix) {
        const point = svg.createSVGPoint();
        point.x = clientX;
        point.y = clientY;
        return point.matrixTransform(matrix.inverse());
    }

    const rect = svg.getBoundingClientRect();
    return {
        x: ((clientX - rect.left) / rect.width) * layoutState.sheet.width,
        y: ((clientY - rect.top) / rect.height) * layoutState.sheet.height
    };
}

function lockCropTouchDrag(svg) {
    cropDragState.previousSheetStackTouchAction = elements.sheetStack?.style.touchAction || '';
    cropDragState.previousSheetTouchAction = elements.sheet?.style.touchAction || '';
    cropDragState.previousBodyUserSelect = document.body.style.userSelect || '';

    if (elements.sheetStack) {
        elements.sheetStack.style.touchAction = 'none';
    }
    if (elements.sheet) {
        elements.sheet.style.touchAction = 'none';
    }
    if (svg) {
        svg.style.touchAction = 'none';
    }
    document.body.style.userSelect = 'none';
}

function unlockCropTouchDrag(svg) {
    if (elements.sheetStack) {
        elements.sheetStack.style.touchAction = cropDragState.previousSheetStackTouchAction;
    }
    if (elements.sheet) {
        elements.sheet.style.touchAction = cropDragState.previousSheetTouchAction;
    }
    if (svg) {
        svg.style.touchAction = '';
    }
    document.body.style.userSelect = cropDragState.previousBodyUserSelect;
}

function setSVGRectAttributes(rect, rectData) {
    if (!rect) return;

    rect.setAttribute('x', rectData.x);
    rect.setAttribute('y', rectData.y);
    rect.setAttribute('width', rectData.width);
    rect.setAttribute('height', rectData.height);
}

function getCropFromDragPoint(edge, startCrop, startPoint, currentPoint) {
    const deltaX = currentPoint.x - startPoint.x;
    const deltaY = currentPoint.y - startPoint.y;
    const nextCrop = { ...startCrop };

    if (edge === 'top') {
        nextCrop.top = startCrop.top + deltaY;
    } else if (edge === 'right') {
        nextCrop.right = startCrop.right - deltaX;
    } else if (edge === 'bottom') {
        nextCrop.bottom = startCrop.bottom - deltaY;
    } else if (edge === 'left') {
        nextCrop.left = startCrop.left + deltaX;
    } else if (edge === 'top-left') {
        nextCrop.top = startCrop.top + deltaY;
        nextCrop.left = startCrop.left + deltaX;
    } else if (edge === 'top-right') {
        nextCrop.top = startCrop.top + deltaY;
        nextCrop.right = startCrop.right - deltaX;
    } else if (edge === 'bottom-right') {
        nextCrop.bottom = startCrop.bottom - deltaY;
        nextCrop.right = startCrop.right - deltaX;
    } else if (edge === 'bottom-left') {
        nextCrop.bottom = startCrop.bottom - deltaY;
        nextCrop.left = startCrop.left + deltaX;
    }

    return nextCrop;
}

function previewCellCrop(crop, contentRect, cropBorderRect, clipRect) {
    const cropRect = getCroppedContentRect({ crop }, contentRect);
    setSVGRectAttributes(cropBorderRect, cropRect);
    setSVGRectAttributes(clipRect, cropRect);
}

function getNearestCropSnapValue(value, targets) {
    const threshold = CONFIG.interaction.cropSnapThreshold;
    let nearestValue = value;
    let nearestDistance = threshold;

    for (const target of targets) {
        const distance = Math.abs(target - value);
        if (distance <= nearestDistance) {
            nearestValue = target;
            nearestDistance = distance;
        }
    }

    return nearestValue;
}

function collectCropSnapTargets(activeCellIndex) {
    const { totalCells, gridSpacing } = getGridMetrics();
    const targets = { x: [], y: [] };

    if (totalCells <= 1) {
        return targets;
    }

    for (let i = 0; i < totalCells; i++) {
        if (i === activeCellIndex) continue;
        if (!hasCustomCrop(layoutState.cells[i])) continue;

        const { x, y, width, height } = getCellCoordinates(i);
        const contentRect = getContentRectFromCellBounds(x, y, width, height, gridSpacing.cellPadding);
        const cropRect = getCroppedContentRect(layoutState.cells[i], contentRect);
        targets.x.push(cropRect.x, cropRect.x + cropRect.width);
        targets.y.push(cropRect.y, cropRect.y + cropRect.height);
    }

    return targets;
}

function applyCropSnap(edge, crop, contentRect, snapTargets) {
    const nextCrop = clampCellCrop(crop, contentRect.width, contentRect.height);
    const cropRect = getCroppedContentRect({ crop: nextCrop }, contentRect);
    const rightEdge = contentRect.x + contentRect.width;
    const bottomEdge = contentRect.y + contentRect.height;

    if (edge === 'left' || edge === 'top-left' || edge === 'bottom-left') {
        nextCrop.left = getNearestCropSnapValue(cropRect.x, snapTargets.x) - contentRect.x;
    }
    if (edge === 'right' || edge === 'top-right' || edge === 'bottom-right') {
        nextCrop.right = rightEdge - getNearestCropSnapValue(cropRect.x + cropRect.width, snapTargets.x);
    }
    if (edge === 'top' || edge === 'top-left' || edge === 'top-right') {
        nextCrop.top = getNearestCropSnapValue(cropRect.y, snapTargets.y) - contentRect.y;
    }
    if (edge === 'bottom' || edge === 'bottom-left' || edge === 'bottom-right') {
        nextCrop.bottom = bottomEdge - getNearestCropSnapValue(cropRect.y + cropRect.height, snapTargets.y);
    }

    return clampCellCrop(nextCrop, contentRect.width, contentRect.height);
}

function startCellCropDragFromClientPoint(event, cellIndex, edge, contentRect, clientX, clientY, options = {}) {
    if (cropDragState.active) {
        event.preventDefault();
        event.stopPropagation();
        return;
    }

    event.preventDefault();
    event.stopPropagation();
    hideBitonalPopover();
    resetPageSwipeTracking();
    suppressNextCellClick();

    const svg = elements.sheet.querySelector('svg');
    if (!svg) return;

    cropDragState.active = true;
    const dragTarget = event.currentTarget;
    const pointerId = options.pointerId;

    if (pointerId !== undefined) {
        try {
            dragTarget.setPointerCapture?.(pointerId);
        } catch (error) {
            // Pointer capture is best-effort; document listeners keep the drag working.
        }
    }

    lockCropTouchDrag(svg);

    const cropBorderRect = dragTarget.parentNode?.querySelector('[data-crop-border="true"]');
    const clipRect = elements.sheet.querySelector(`#cell-clip-${cellIndex} rect`);
    const startPoint = getClientPointInSVG(svg, clientX, clientY);
    const startCrop = clampCellCrop(layoutState.cells[cellIndex]?.crop, contentRect.width, contentRect.height);
    const snapTargets = collectCropSnapTargets(cellIndex);
    let pendingPoint = startPoint;
    let currentCrop = startCrop;
    let frameRequestId = null;

    const applyPendingCrop = () => {
        frameRequestId = null;
        const draggedCrop = getCropFromDragPoint(edge, startCrop, startPoint, pendingPoint);
        currentCrop = applyCropSnap(edge, draggedCrop, contentRect, snapTargets);
        previewCellCrop(currentCrop, contentRect, cropBorderRect, clipRect);
    };

    const queueCropPreview = (moveClientX, moveClientY) => {
        pendingPoint = getClientPointInSVG(svg, moveClientX, moveClientY);
        if (frameRequestId === null) {
            frameRequestId = requestAnimationFrame(applyPendingCrop);
        }
    };

    const handlePointerMove = (moveEvent) => {
        if (pointerId !== undefined && moveEvent.pointerId !== pointerId) return;

        moveEvent.preventDefault();
        moveEvent.stopPropagation();
        queueCropPreview(moveEvent.clientX, moveEvent.clientY);
    };

    const touchIdentifier = options.touchIdentifier;
    const handleTouchMove = (moveEvent) => {
        const touch = Array.from(moveEvent.touches).find(item => item.identifier === touchIdentifier);
        if (!touch) return;

        moveEvent.preventDefault();
        moveEvent.stopPropagation();
        queueCropPreview(touch.clientX, touch.clientY);
    };

    const endDrag = (endEvent = {}) => {
        if (endEvent.pointerId !== undefined && pointerId !== undefined && endEvent.pointerId !== pointerId) {
            return;
        }

        if (frameRequestId !== null) {
            cancelAnimationFrame(frameRequestId);
            applyPendingCrop();
        }

        setCellCrop(cellIndex, currentCrop, contentRect);
        updateSingleCell(cellIndex);

        if (pointerId !== undefined) {
            try {
                dragTarget.releasePointerCapture?.(pointerId);
            } catch (error) {
                // Ignore if capture was already released by the browser.
            }
        }

        cropDragState.active = false;
        unlockCropTouchDrag(svg);
        document.removeEventListener('pointermove', handlePointerMove);
        document.removeEventListener('pointerup', endDrag);
        document.removeEventListener('pointercancel', endDrag);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
        document.removeEventListener('touchcancel', handleTouchEnd);
    };

    const handleTouchEnd = (endEvent) => {
        const activeTouchExists = Array.from(endEvent.touches).some(item => item.identifier === touchIdentifier);
        if (!activeTouchExists) {
            endDrag();
        }
    };

    if (options.inputType === 'touch') {
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd);
        document.addEventListener('touchcancel', handleTouchEnd);
    } else {
        document.addEventListener('pointermove', handlePointerMove, { passive: false });
        document.addEventListener('pointerup', endDrag);
        document.addEventListener('pointercancel', endDrag);
    }
}

function startCellCropDrag(event, cellIndex, edge, contentRect) {
    if (event.pointerType === 'touch') {
        event.preventDefault();
        event.stopPropagation();
        return;
    }

    startCellCropDragFromClientPoint(event, cellIndex, edge, contentRect, event.clientX, event.clientY, {
        inputType: 'pointer',
        pointerId: event.pointerId
    });
}

function startCellCropTouchDrag(event, cellIndex, edge, contentRect) {
    const touch = event.changedTouches[0];
    if (!touch || event.touches.length !== 1) return;

    startCellCropDragFromClientPoint(event, cellIndex, edge, contentRect, touch.clientX, touch.clientY, {
        inputType: 'touch',
        touchIdentifier: touch.identifier
    });
}

function appendCropBorderHitArea(cellUIGroup, cellIndex, edge, contentRect, cropRect) {
    const hitWidth = CONFIG.ui.cropBorderHitWidth;
    const halfHitWidth = hitWidth / 2;
    const hitArea = document.createElementNS('http://www.w3.org/2000/svg', 'rect');

    if (edge === 'top') {
        hitArea.setAttribute('x', cropRect.x);
        hitArea.setAttribute('y', cropRect.y - halfHitWidth);
        hitArea.setAttribute('width', cropRect.width);
        hitArea.setAttribute('height', hitWidth);
        hitArea.style.cursor = 'ns-resize';
    } else if (edge === 'right') {
        hitArea.setAttribute('x', cropRect.x + cropRect.width - halfHitWidth);
        hitArea.setAttribute('y', cropRect.y);
        hitArea.setAttribute('width', hitWidth);
        hitArea.setAttribute('height', cropRect.height);
        hitArea.style.cursor = 'ew-resize';
    } else if (edge === 'bottom') {
        hitArea.setAttribute('x', cropRect.x);
        hitArea.setAttribute('y', cropRect.y + cropRect.height - halfHitWidth);
        hitArea.setAttribute('width', cropRect.width);
        hitArea.setAttribute('height', hitWidth);
        hitArea.style.cursor = 'ns-resize';
    } else if (edge === 'left') {
        hitArea.setAttribute('x', cropRect.x - halfHitWidth);
        hitArea.setAttribute('y', cropRect.y);
        hitArea.setAttribute('width', hitWidth);
        hitArea.setAttribute('height', cropRect.height);
        hitArea.style.cursor = 'ew-resize';
    }

    hitArea.setAttribute('fill', 'transparent');
    hitArea.setAttribute('pointer-events', 'all');
    hitArea.style.touchAction = 'none';
    hitArea.addEventListener('touchstart', (event) => startCellCropTouchDrag(event, cellIndex, edge, contentRect), { passive: false });
    hitArea.addEventListener('pointerdown', (event) => startCellCropDrag(event, cellIndex, edge, contentRect));
    hitArea.addEventListener('click', (event) => {
        event.stopPropagation();
    });
    cellUIGroup.appendChild(hitArea);
}

function appendCropCornerHitArea(cellUIGroup, cellIndex, corner, contentRect, cropRect) {
    const hitSize = CONFIG.ui.cropCornerHitSize;
    const halfHitSize = hitSize / 2;
    const hitArea = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    let cornerX = cropRect.x;
    let cornerY = cropRect.y;

    if (corner === 'top-right' || corner === 'bottom-right') {
        cornerX = cropRect.x + cropRect.width;
    }

    if (corner === 'bottom-right' || corner === 'bottom-left') {
        cornerY = cropRect.y + cropRect.height;
    }

    hitArea.setAttribute('x', cornerX - halfHitSize);
    hitArea.setAttribute('y', cornerY - halfHitSize);
    hitArea.setAttribute('width', hitSize);
    hitArea.setAttribute('height', hitSize);
    hitArea.setAttribute('fill', 'transparent');
    hitArea.setAttribute('pointer-events', 'all');
    hitArea.style.cursor = corner === 'top-left' || corner === 'bottom-right'
        ? 'nwse-resize'
        : 'nesw-resize';
    hitArea.style.touchAction = 'none';
    hitArea.addEventListener('touchstart', (event) => startCellCropTouchDrag(event, cellIndex, corner, contentRect), { passive: false });
    hitArea.addEventListener('pointerdown', (event) => startCellCropDrag(event, cellIndex, corner, contentRect));
    hitArea.addEventListener('click', (event) => {
        event.stopPropagation();
    });
    cellUIGroup.appendChild(hitArea);
}

function renderCellCropBorder(cellUIGroup, cellIndex, contentRect, cropRect, hasImage) {
    const borderRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    borderRect.setAttribute('x', cropRect.x);
    borderRect.setAttribute('y', cropRect.y);
    borderRect.setAttribute('width', cropRect.width);
    borderRect.setAttribute('height', cropRect.height);
    borderRect.setAttribute('fill', 'none');
    borderRect.setAttribute('stroke', hasImage ? 'rgba(220, 38, 38, 0.95)' : '#adb5bd');
    borderRect.setAttribute('stroke-width', CONFIG.ui.cropBorderStrokeWidth);
    borderRect.setAttribute('pointer-events', 'none');
    borderRect.setAttribute('data-crop-border', 'true');

    if (hasImage) {
        borderRect.setAttribute('stroke-dasharray', '2 1.5');
    }

    cellUIGroup.appendChild(borderRect);
    appendCropBorderHitArea(cellUIGroup, cellIndex, 'top', contentRect, cropRect);
    appendCropBorderHitArea(cellUIGroup, cellIndex, 'right', contentRect, cropRect);
    appendCropBorderHitArea(cellUIGroup, cellIndex, 'bottom', contentRect, cropRect);
    appendCropBorderHitArea(cellUIGroup, cellIndex, 'left', contentRect, cropRect);
    appendCropCornerHitArea(cellUIGroup, cellIndex, 'top-left', contentRect, cropRect);
    appendCropCornerHitArea(cellUIGroup, cellIndex, 'top-right', contentRect, cropRect);
    appendCropCornerHitArea(cellUIGroup, cellIndex, 'bottom-right', contentRect, cropRect);
    appendCropCornerHitArea(cellUIGroup, cellIndex, 'bottom-left', contentRect, cropRect);
}

function clearOcrFlashTimer() {
    if (ocrState.flashTimeoutId) {
        clearTimeout(ocrState.flashTimeoutId);
        ocrState.flashTimeoutId = null;
    }
}

function clearOcrVisualState(options = {}) {
    const { render = true } = options;

    clearOcrFlashTimer();
    ocrState.activeCell = null;
    ocrState.flashItems = [];

    if (render) {
        renderSVGSheet();
    }
}

function setOcrActiveCell(pageIndex, cellIndex) {
    ocrState.activeCell = { pageIndex, cellIndex };

    if (appState.currentPageIndex === pageIndex) {
        renderSVGSheet();
    }
}

function waitForNextPaint() {
    return new Promise(resolve => requestAnimationFrame(() => resolve()));
}

function waitForDuration(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForOcrScanFeedback() {
    if (document.visibilityState === 'hidden') {
        return;
    }

    await waitForNextPaint();

    if (CONFIG.ocr.minScanFeedbackMs > 0) {
        await waitForDuration(CONFIG.ocr.minScanFeedbackMs);
    }
}

function getCurrentSvgScreenScale() {
    const svg = elements.sheet?.querySelector('svg');
    const svgRect = svg?.getBoundingClientRect();

    if (!svgRect || !layoutState.sheet.width || !layoutState.sheet.height) {
        return 1;
    }

    return Math.min(
        svgRect.width / layoutState.sheet.width,
        svgRect.height / layoutState.sheet.height
    ) || 1;
}

function isCurrentOcrActiveCell(cellIndex) {
    return ocrState.busy
        && ocrState.activeCell?.pageIndex === appState.currentPageIndex
        && ocrState.activeCell?.cellIndex === cellIndex;
}

function appendOcrFlashItems(pageIndex, cellIndex, items) {
    if (!items.length) {
        return;
    }

    ocrState.flashItems = ocrState.flashItems.filter(item => (
        item.pageIndex !== pageIndex || item.cellIndex !== cellIndex
    ));
    ocrState.flashItems.push({ pageIndex, cellIndex, items });

    if (appState.currentPageIndex === pageIndex) {
        updateSingleCell(cellIndex);
    }
}

function scheduleOcrFlashClear(duration = CONFIG.ocr.flashDurationMs) {
    clearOcrFlashTimer();
    ocrState.flashTimeoutId = setTimeout(() => {
        ocrState.flashItems = [];
        ocrState.flashTimeoutId = null;
        renderSVGSheet();
    }, duration);
}

function getOcrFlashItemsForCurrentCell(cellIndex) {
    return ocrState.flashItems.find(item => (
        item.pageIndex === appState.currentPageIndex && item.cellIndex === cellIndex
    ))?.items || [];
}

function renderOcrCellActivity(cellUIGroup, cellIndex, cellRect, contentRect) {
    if (!isCurrentOcrActiveCell(cellIndex)) {
        return;
    }

    const sweepRect = getActualImageBounds(cellIndex) || contentRect;
    const bandHeight = Math.max(4, sweepRect.height * 0.16);
    const startY = sweepRect.y - bandHeight;
    const duration = `${(CONFIG.ocr.scanSweepDurationMs / 1000).toFixed(2)}s`;
    const travelPx = (sweepRect.height + bandHeight) * getCurrentSvgScreenScale();
    const clipId = `ocr-scan-clip-${appState.currentPageIndex}-${cellIndex}`;

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
    clipPath.setAttribute('id', clipId);

    const clipRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    clipRect.setAttribute('x', sweepRect.x);
    clipRect.setAttribute('y', sweepRect.y);
    clipRect.setAttribute('width', sweepRect.width);
    clipRect.setAttribute('height', sweepRect.height);
    clipPath.appendChild(clipRect);
    defs.appendChild(clipPath);
    cellUIGroup.appendChild(defs);

    const sweepGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    sweepGroup.setAttribute('class', 'ocr-scan-sweep');
    sweepGroup.setAttribute('clip-path', `url(#${clipId})`);

    const positionGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    positionGroup.setAttribute('transform', `translate(0 ${startY})`);

    const trackGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    trackGroup.setAttribute('class', 'ocr-scan-sweep-track');
    trackGroup.style.setProperty('--ocr-scan-duration', duration);
    trackGroup.style.setProperty('--ocr-sweep-distance', `${travelPx.toFixed(2)}px`);

    const band = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    band.setAttribute('x', sweepRect.x);
    band.setAttribute('y', '0');
    band.setAttribute('width', sweepRect.width);
    band.setAttribute('height', bandHeight);
    band.setAttribute('class', 'ocr-scan-sweep-band');

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', sweepRect.x);
    line.setAttribute('x2', sweepRect.x + sweepRect.width);
    line.setAttribute('y1', bandHeight);
    line.setAttribute('y2', bandHeight);
    line.setAttribute('class', 'ocr-scan-sweep-line');

    trackGroup.appendChild(band);
    trackGroup.appendChild(line);
    positionGroup.appendChild(trackGroup);
    sweepGroup.appendChild(positionGroup);
    cellUIGroup.appendChild(sweepGroup);
}

function renderOcrFlashBoxes(cellUIGroup, cellIndex) {
    const items = getOcrFlashItemsForCurrentCell(cellIndex);

    if (!items.length) {
        return;
    }

    const imageBounds = getActualImageBounds(cellIndex);

    if (!imageBounds) {
        return;
    }

    const flashGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    flashGroup.setAttribute('class', 'ocr-bbox-flash-group');

    for (const item of items) {
        const bounds = getNormalizedOcrBounds(item.polyNorm);

        if (!bounds || bounds.width <= 0 || bounds.height <= 0) {
            continue;
        }

        const box = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        box.setAttribute('x', imageBounds.x + bounds.x * imageBounds.width);
        box.setAttribute('y', imageBounds.y + bounds.y * imageBounds.height);
        box.setAttribute('width', bounds.width * imageBounds.width);
        box.setAttribute('height', bounds.height * imageBounds.height);
        box.setAttribute('rx', '0.6');
        box.setAttribute('class', 'ocr-bbox-flash');
        flashGroup.appendChild(box);
    }

    if (flashGroup.childNodes.length) {
        cellUIGroup.appendChild(flashGroup);
    }
}

function renderOcrCellVisuals(cellUIGroup, cellIndex, cellRect, contentRect) {
    renderOcrCellActivity(cellUIGroup, cellIndex, cellRect, contentRect);
    renderOcrFlashBoxes(cellUIGroup, cellIndex);
}

// SVG cell rendering function
function renderSVGCell(cellContentGroup, cellUIGroup, cellIndex, cellX, cellY, cellWidth, cellHeight, cellPadding) {
    const cellData = layoutState.cells[cellIndex];
    const contentRect = getContentRectFromCellBounds(cellX, cellY, cellWidth, cellHeight, cellPadding);
    const cropRect = getCroppedContentRect(cellData, contentRect);
    
    if (cellData?.image) {
        const imageGeometry = getCellImageGeometry(cellData, contentRect);
        
        // Create clipping path for the cell content area
        const clipId = `cell-clip-${cellIndex}`;
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
        clipPath.setAttribute('id', clipId);
        
        const clipRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        clipRect.setAttribute('x', cropRect.x);
        clipRect.setAttribute('y', cropRect.y);
        clipRect.setAttribute('width', cropRect.width);
        clipRect.setAttribute('height', cropRect.height);
        clipPath.appendChild(clipRect);
        defs.appendChild(clipPath);
        cellContentGroup.appendChild(defs);
        
        // Create image element with different handling for cover mode
        const imageEl = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        imageEl.setAttribute('href', cellData.image.src);
        imageEl.setAttribute('clip-path', `url(#${clipId})`);
        imageEl.style.cursor = 'pointer';

        if (imageGeometry) {
            imageEl.setAttribute('x', imageGeometry.renderRect.x);
            imageEl.setAttribute('y', imageGeometry.renderRect.y);
            imageEl.setAttribute('width', imageGeometry.renderRect.width);
            imageEl.setAttribute('height', imageGeometry.renderRect.height);
            imageEl.setAttribute('preserveAspectRatio', imageGeometry.preserveAspectRatio);
        }

        if (cellData.fillMode === 'cover' && imageGeometry) {
            // Setup interactive behavior for cover mode
            setupImageInteraction(imageEl, cellIndex, imageGeometry.interactionRect);
        } else {
            // Add click handler for cycling fill mode
            imageEl.addEventListener('click', (e) => {
                e.stopPropagation();
                cycleFillMode(cellIndex);
            });
        }
        
        cellContentGroup.appendChild(imageEl);
        renderCellCropBorder(cellUIGroup, cellIndex, contentRect, cropRect, true);
        renderOcrCellVisuals(cellUIGroup, cellIndex, {
            x: cellX,
            y: cellY,
            width: cellWidth,
            height: cellHeight
        }, contentRect);
        
        // Add fill mode cycling button (circle with square icon in top-left corner, inside cell)
        const fillModeBtn = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        fillModeBtn.style.cursor = 'pointer';
        
        const fillModeBtnCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        fillModeBtnCircle.setAttribute('cx', cellX + CONFIG.ui.buttonRadius);
        fillModeBtnCircle.setAttribute('cy', cellY + CONFIG.ui.buttonRadius);
        fillModeBtnCircle.setAttribute('r', CONFIG.ui.buttonRadius);
        fillModeBtnCircle.setAttribute('fill', 'rgba(40, 167, 69, 0.9)');
        fillModeBtnCircle.setAttribute('stroke', 'white');
        fillModeBtnCircle.setAttribute('stroke-width', CONFIG.ui.buttonStrokeWidth);
        
        // Simple white square outline icon (larger)
        const fillModeBtnIcon = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        fillModeBtnIcon.setAttribute('x', cellX + CONFIG.ui.buttonRadius - CONFIG.ui.buttonIconSize / 2);
        fillModeBtnIcon.setAttribute('y', cellY + CONFIG.ui.buttonRadius - CONFIG.ui.buttonIconSize / 2);
        fillModeBtnIcon.setAttribute('width', CONFIG.ui.buttonIconSize);
        fillModeBtnIcon.setAttribute('height', CONFIG.ui.buttonIconSize);
        fillModeBtnIcon.setAttribute('fill', 'none');
        fillModeBtnIcon.setAttribute('stroke', 'white');
        fillModeBtnIcon.setAttribute('stroke-width', CONFIG.ui.buttonStrokeWidth);
        
        fillModeBtn.appendChild(fillModeBtnCircle);
        fillModeBtn.appendChild(fillModeBtnIcon);
        
        // Add click handler for fill mode cycling button
        fillModeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            cycleFillMode(cellIndex);
        });
        
        cellUIGroup.appendChild(fillModeBtn);

        const filterConfig = getCellFilterConfig(cellData.filter || 'original');
        const filterBtn = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        filterBtn.style.cursor = 'pointer';
        filterBtn.setAttribute('data-control', 'filter');

        const filterBtnCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        filterBtnCircle.setAttribute('cx', cellX + cellWidth / 2);
        filterBtnCircle.setAttribute('cy', cellY + 12);
        filterBtnCircle.setAttribute('r', '12');
        filterBtnCircle.setAttribute('fill', 'rgba(111, 66, 193, 0.92)');
        filterBtnCircle.setAttribute('stroke', 'white');
        filterBtnCircle.setAttribute('stroke-width', '2');

        const filterBtnText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        filterBtnText.setAttribute('x', cellX + cellWidth / 2);
        filterBtnText.setAttribute('y', cellY + 12);
        filterBtnText.setAttribute('text-anchor', 'middle');
        filterBtnText.setAttribute('dominant-baseline', 'central');
        filterBtnText.setAttribute('font-family', 'monospace');
        filterBtnText.setAttribute('font-size', filterConfig.label.length > 1 ? '10' : '13');
        filterBtnText.setAttribute('fill', 'white');
        filterBtnText.setAttribute('font-weight', 'bold');
        filterBtnText.textContent = filterConfig.label;

        filterBtn.appendChild(filterBtnCircle);
        filterBtn.appendChild(filterBtnText);
        filterBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (bitonalPopoverState.suppressNextClick) {
                bitonalPopoverState.suppressNextClick = false;
                return;
            }
            cycleCellFilter(cellIndex);
        });
        bindBitonalPopoverTriggers(filterBtn, cellIndex);

        cellUIGroup.appendChild(filterBtn);
        
        // Add remove button (circle with X in top-right corner, inside cell)
        const removeBtn = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        removeBtn.style.cursor = 'pointer';
        
        const removeBtnCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        removeBtnCircle.setAttribute('cx', cellX + cellWidth - 12);
        removeBtnCircle.setAttribute('cy', cellY + 12);
        removeBtnCircle.setAttribute('r', '12');
        removeBtnCircle.setAttribute('fill', 'rgba(220, 53, 69, 0.9)');
        removeBtnCircle.setAttribute('stroke', 'white');
        removeBtnCircle.setAttribute('stroke-width', '2');
        
        const removeBtnText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        removeBtnText.setAttribute('x', cellX + cellWidth - 12);
        removeBtnText.setAttribute('y', cellY + 12);
        removeBtnText.setAttribute('text-anchor', 'middle');
        removeBtnText.setAttribute('dominant-baseline', 'central');
        removeBtnText.setAttribute('font-family', 'monospace');
        removeBtnText.setAttribute('font-size', '16');
        removeBtnText.setAttribute('fill', 'white');
        removeBtnText.setAttribute('font-weight', 'bold');
        removeBtnText.textContent = '×';
        
        removeBtn.appendChild(removeBtnCircle);
        removeBtn.appendChild(removeBtnText);
        
        // Add click handler for remove button
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeCellContent(cellIndex);
        });
        
        cellUIGroup.appendChild(removeBtn);
        
        // Add rotation button (circle with rotate icon in bottom-left corner, inside cell)
        const rotateBtn = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        rotateBtn.style.cursor = 'pointer';
        
        const rotateBtnCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        rotateBtnCircle.setAttribute('cx', cellX + 12);
        rotateBtnCircle.setAttribute('cy', cellY + cellHeight - 12);
        rotateBtnCircle.setAttribute('r', '12');
        rotateBtnCircle.setAttribute('fill', 'rgba(255, 193, 7, 0.9)'); // Yellow/orange color
        rotateBtnCircle.setAttribute('stroke', 'white');
        rotateBtnCircle.setAttribute('stroke-width', '2');
        
        // Rotation arrow icon (⟲ Unicode character)
        const rotateBtnText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        rotateBtnText.setAttribute('x', cellX + 12);
        rotateBtnText.setAttribute('y', cellY + cellHeight - 12);
        rotateBtnText.setAttribute('text-anchor', 'middle');
        rotateBtnText.setAttribute('dominant-baseline', 'central');
        rotateBtnText.setAttribute('font-family', 'monospace');
        rotateBtnText.setAttribute('font-size', '14');
        rotateBtnText.setAttribute('fill', 'white');
        rotateBtnText.setAttribute('font-weight', 'bold');
        rotateBtnText.textContent = '↻';
        
        rotateBtn.appendChild(rotateBtnCircle);
        rotateBtn.appendChild(rotateBtnText);
        
        // Add click handler for rotation button
        rotateBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            rotateImage(cellIndex);
        });
        
        cellUIGroup.appendChild(rotateBtn);
        
        // Add reset button for cover mode (circle with reset icon in bottom-right corner, inside cell)
        if (cellData.fillMode === 'cover') {
            const resetBtn = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            resetBtn.style.cursor = 'pointer';
            
            const resetBtnCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            resetBtnCircle.setAttribute('cx', cellX + cellWidth - 12);
            resetBtnCircle.setAttribute('cy', cellY + cellHeight - 12);
            resetBtnCircle.setAttribute('r', '12');
            resetBtnCircle.setAttribute('fill', 'rgba(13, 110, 253, 0.9)');
            resetBtnCircle.setAttribute('stroke', 'white');
            resetBtnCircle.setAttribute('stroke-width', '2');
            
            const resetBtnText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            resetBtnText.setAttribute('x', cellX + cellWidth - 12);
            resetBtnText.setAttribute('y', cellY + cellHeight - 12);
            resetBtnText.setAttribute('text-anchor', 'middle');
            resetBtnText.setAttribute('dominant-baseline', 'central');
            resetBtnText.setAttribute('font-family', 'monospace');
            resetBtnText.setAttribute('font-size', '14');
            resetBtnText.setAttribute('fill', 'white');
            resetBtnText.setAttribute('font-weight', 'bold');
            resetBtnText.textContent = '←';
            
            resetBtn.appendChild(resetBtnCircle);
            resetBtn.appendChild(resetBtnText);
            
            // Add click handler for reset button
            resetBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                // Reset transform to default values
                cellData.transform = { scale: 1, translateX: 0, translateY: 0 };
                renderSVGSheet();
            });
            
            cellUIGroup.appendChild(resetBtn);
        }
        
    } else {
        // Empty cell - add cell background for visual reference
        const cellRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        cellRect.setAttribute('x', cellX);
        cellRect.setAttribute('y', cellY);
        cellRect.setAttribute('width', cellWidth);
        cellRect.setAttribute('height', cellHeight);
        cellRect.setAttribute('fill', '#f8f9fa');
        cellRect.setAttribute('stroke', 'none');
        cellUIGroup.appendChild(cellRect);
        renderCellCropBorder(cellUIGroup, cellIndex, contentRect, cropRect, false);
        
        // Empty cell - add subtle "+" button
        const addBtn = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        addBtn.style.cursor = 'pointer';
        
        const addBtnCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        addBtnCircle.setAttribute('cx', cellX + cellWidth / 2);
        addBtnCircle.setAttribute('cy', cellY + cellHeight / 2);
        addBtnCircle.setAttribute('r', '12'); // Bigger than control buttons
        addBtnCircle.setAttribute('fill', 'rgba(173, 181, 189, 0.3)'); // Light gray, barely visible
        addBtnCircle.setAttribute('stroke', 'rgba(173, 181, 189, 0.5)');
        addBtnCircle.setAttribute('stroke-width', '1');
        
        const addBtnText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        addBtnText.setAttribute('x', cellX + cellWidth / 2);
        addBtnText.setAttribute('y', cellY + cellHeight / 2);
        addBtnText.setAttribute('text-anchor', 'middle');
        addBtnText.setAttribute('dominant-baseline', 'central');
        addBtnText.setAttribute('font-family', 'monospace');
        addBtnText.setAttribute('font-size', '16');
        addBtnText.setAttribute('fill', 'rgba(173, 181, 189, 0.7)');
        addBtnText.setAttribute('font-weight', 'normal');
        addBtnText.textContent = '+';
        
        addBtn.appendChild(addBtnCircle);
        addBtn.appendChild(addBtnText);
        
        cellUIGroup.appendChild(addBtn);
    }
}

// SVG-based sheet rendering function
function renderSVGSheet() {
    const { width, height, totalCells, gridSpacing } = getGridMetrics();
    
    // Clear the sheet container
    elements.sheet.innerHTML = '';
    
    // Create SVG element with mm dimensions
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.style.border = '1px solid #ccc';
    svg.style.background = 'white';
    
    // Create content layer (for export)
    const contentLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    contentLayer.setAttribute('id', 'content-layer');
    
    // Create UI layer (hidden during export)
    const uiLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    uiLayer.setAttribute('id', 'ui-layer');
    
    // Add sheet background to content layer
    const sheetBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    sheetBg.setAttribute('x', '0');
    sheetBg.setAttribute('y', '0');
    sheetBg.setAttribute('width', width);
    sheetBg.setAttribute('height', height);
    sheetBg.setAttribute('fill', 'white');
    sheetBg.setAttribute('stroke', '#ddd');
    sheetBg.setAttribute('stroke-width', '0.5');
    contentLayer.appendChild(sheetBg);
    
    // Render each cell
    for (let i = 0; i < totalCells; i++) {
        const { x: cellX, y: cellY, width: cellWidth, height: cellHeight } = getCellCoordinates(i);
        
        // Create cell content group (for export)
        const cellContentGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        cellContentGroup.setAttribute('data-cell-index', i);
        cellContentGroup.setAttribute('class', 'cell-content');
        
        // Create cell UI group (hidden during export)
        const cellUIGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        cellUIGroup.setAttribute('data-cell-index', i);
        cellUIGroup.setAttribute('class', 'cell-ui');
        cellUIGroup.style.cursor = 'pointer';
        
        // Render cell content (images go to content layer, buttons and cell visuals go to UI layer)
        renderSVGCell(cellContentGroup, cellUIGroup, i, cellX, cellY, cellWidth, cellHeight, gridSpacing.cellPadding);
        
        // Add click handler for cell interaction to UI layer
        cellUIGroup.addEventListener('click', (event) => handleCellUIClick(event, i));
        
        // Add groups to respective layers
        contentLayer.appendChild(cellContentGroup);
        uiLayer.appendChild(cellUIGroup);
    }
    
    // Add layers to SVG
    svg.appendChild(contentLayer);
    svg.appendChild(uiLayer);
    
    elements.sheet.appendChild(svg);
}

function updateSheetGrid() {
    renderCurrentPage();
}

function setupGridMatrix() {
    const matrix = elements.gridMatrix;
    matrix.innerHTML = '';
    
    // Track touch state for drag highlighting
    let isDragging = false;
    
    // Create 5x5 grid of selectable cells
    for (let row = 1; row <= CONFIG.maxGridSize; row++) {
        for (let col = 1; col <= CONFIG.maxGridSize; col++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            // Mouse event handlers for desktop
            cell.addEventListener('mouseenter', () => highlightGridArea(col, row));
            cell.addEventListener('click', () => selectGrid(col, row));
            
            // Touch event handlers for mobile
            cell.addEventListener('touchstart', (e) => {
                e.preventDefault(); // Prevent scrolling and other default behaviors
                isDragging = true;
                highlightGridArea(col, row);
            });
            
            cell.addEventListener('touchmove', (e) => {
                e.preventDefault();
                if (isDragging) {
                    // Find which cell is under the touch point
                    const touch = e.touches[0];
                    const elementUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY);
                    
                    if (elementUnderTouch && elementUnderTouch.classList.contains('grid-cell')) {
                        const touchCol = parseInt(elementUnderTouch.dataset.col);
                        const touchRow = parseInt(elementUnderTouch.dataset.row);
                        highlightGridArea(touchCol, touchRow);
                    }
                }
            });
            
            cell.addEventListener('touchend', (e) => {
                e.preventDefault();
                if (isDragging) {
                    isDragging = false;
                    // Select the grid that was highlighted when touch ended
                    const touch = e.changedTouches[0];
                    const elementUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY);
                    
                    if (elementUnderTouch && elementUnderTouch.classList.contains('grid-cell')) {
                        const touchCol = parseInt(elementUnderTouch.dataset.col);
                        const touchRow = parseInt(elementUnderTouch.dataset.row);
                        selectGrid(touchCol, touchRow);
                    }
                }
            });
            
            matrix.appendChild(cell);
        }
    }
    
    // Add global touch cancel handler for the grid matrix
    matrix.addEventListener('touchcancel', () => {
        isDragging = false;
    });
}

function highlightGridArea(cols, rows) {
    const cells = elements.gridMatrix.children;
    
    for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];
        const cellCol = parseInt(cell.dataset.col);
        const cellRow = parseInt(cell.dataset.row);
        
        if (cellCol <= cols && cellRow <= rows) {
            cell.classList.add('highlighted');
        } else {
            cell.classList.remove('highlighted');
        }
    }
    
    // Update display
    elements.gridDisplay.textContent = `${cols} × ${rows}`;
}

function selectGrid(cols, rows) {
    const currentTotalCells = layoutState.grid.rows * layoutState.grid.cols;
    const newTotalCells = rows * cols;
    const gridChanged = cols !== layoutState.grid.cols || rows !== layoutState.grid.rows;

    if (!gridChanged) {
        resetCellCrops();
        updateSheetGrid();
        hideGridPicker();
        return;
    }
    
    // Check if we're reducing the grid size and if there's data that would be lost
    if (newTotalCells < currentTotalCells) {
        const cellsToRemove = layoutState.cells.slice(newTotalCells);
        const hasDataInRemovedCells = cellsToRemove.some(isCellImageContent);
        
        if (hasDataInRemovedCells) {
            const lostContentCount = cellsToRemove.filter(isCellImageContent).length;
            const confirmMessage = t('grid.shrinkWarning', {
                cols,
                rows,
                removedCells: currentTotalCells - newTotalCells,
                count: lostContentCount
            });
            
            const userConfirmed = confirm(confirmMessage);
            if (!userConfirmed) {
                return; // Don't proceed with grid change
            }
        }
    }
    
    // Proceed with grid change
    layoutState.grid.cols = cols;
    layoutState.grid.rows = rows;
    
    // Clear cells that are outside new grid (now with user consent)
    const totalCells = rows * cols;
    if (layoutState.cells.length > totalCells) {
        layoutState.cells = layoutState.cells.slice(0, totalCells);
    }

    resetCellCrops();
    
    updateSheetGrid();
    hideGridPicker();
}

function showGridPicker() {
    overlayManager.show(elements.gridOverlay, () => {
        // Highlight current grid
        highlightGridArea(layoutState.grid.cols, layoutState.grid.rows);
    });
}

function hideGridPicker() {
    overlayManager.hide(elements.gridOverlay);
}

function setupSizeOptions() {
    const sizeOptions = document.querySelectorAll('.size-option');
    
    sizeOptions.forEach(option => {
        option.addEventListener('click', () => {
            const size = option.dataset.size;
            const orientation = option.dataset.orientation;
            
            // Update state
            layoutState.sheet.paperSize = size;
            layoutState.sheet.orientation = orientation;
            
            // Update UI
            updateSheetSize();
            hideSizePicker();
        });
    });
}

function showSizePicker() {
    overlayManager.show(elements.sizeOverlay, () => {
        // Highlight current selection
        highlightCurrentSize();
    });
}

function hideSizePicker() {
    overlayManager.hide(elements.sizeOverlay);
}

function showExportOverlay() {
    overlayManager.show(elements.exportOverlay);
}

function hideExportOverlay() {
    overlayManager.hide(elements.exportOverlay);
}

function highlightCurrentSize() {
    const sizeOptions = document.querySelectorAll('.size-option');
    const currentSize = layoutState.sheet.paperSize;
    const currentOrientation = layoutState.sheet.orientation;
    
    sizeOptions.forEach(option => {
        const size = option.dataset.size;
        const orientation = option.dataset.orientation;
        
        if (size === currentSize && orientation === currentOrientation) {
            option.classList.add('selected');
        } else {
            option.classList.remove('selected');
        }
    });
}

function showFileTypeSelector() {
    overlayManager.show(elements.fileTypeSelector);
}

function hideFileTypeSelector() {
    overlayManager.hide(elements.fileTypeSelector);
}

function cancelFileTypeSelector() {
    overlayManager.hide(elements.fileTypeSelector, () => {
        currentTargetCell = null;
    });
}

async function showCameraOverlay() {
    overlayManager.show(elements.cameraOverlay);
    resetCameraCapture();

    try {
        await startCameraStream(cameraState.selectedDeviceId);
    } catch (error) {
        hideCameraOverlay();
        alert(t('camera.unavailable'));
    }
}

function hideCameraOverlay() {
    stopCameraStream();
    resetCameraDeviceOptions();
    resetCameraCapture();
    overlayManager.hide(elements.cameraOverlay);
}

function cancelCameraOverlay() {
    hideCameraOverlay();
    currentTargetCell = null;
}

async function startCameraStream(deviceId = '') {
    if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera API not available');
    }

    stopCameraStream();

    const videoConstraints = deviceId ? { deviceId: { exact: deviceId } } : true;
    const stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: false });
    cameraState.stream = stream;

    const activeTrack = stream.getVideoTracks()[0];
    const activeSettings = activeTrack?.getSettings?.();
    cameraState.selectedDeviceId = activeSettings?.deviceId || deviceId || cameraState.selectedDeviceId;

    elements.cameraVideo.srcObject = stream;
    await elements.cameraVideo.play();
    await refreshCameraDevices();
}

function stopCameraStream() {
    if (cameraState.stream) {
        cameraState.stream.getTracks().forEach(track => track.stop());
        cameraState.stream = null;
    }

    if (elements.cameraVideo) {
        elements.cameraVideo.pause();
        elements.cameraVideo.srcObject = null;
    }
}

async function refreshCameraDevices() {
    if (!navigator.mediaDevices?.enumerateDevices) {
        resetCameraDeviceOptions();
        return;
    }

    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    cameraState.devices = videoDevices;

    if (!videoDevices.length) {
        resetCameraDeviceOptions();
        return;
    }

    const currentDeviceId = cameraState.selectedDeviceId || videoDevices[0].deviceId;
    const deviceOptions = videoDevices.map((device, index) => {
        const option = document.createElement('option');
        option.value = device.deviceId;
        option.textContent = device.label || t('camera.deviceFallback', { index: index + 1 });
        return option;
    });

    elements.cameraDeviceSelect.innerHTML = '';
    deviceOptions.forEach(option => elements.cameraDeviceSelect.appendChild(option));
    elements.cameraDeviceSelect.value = videoDevices.some(device => device.deviceId === currentDeviceId)
        ? currentDeviceId
        : videoDevices[0].deviceId;
    cameraState.selectedDeviceId = elements.cameraDeviceSelect.value;

    if (videoDevices.length > 1) {
        elements.cameraDeviceField.classList.remove('hidden');
    } else {
        elements.cameraDeviceField.classList.add('hidden');
    }
}

function resetCameraDeviceOptions() {
    cameraState.devices = [];
    elements.cameraDeviceSelect.innerHTML = '';
    elements.cameraDeviceField.classList.add('hidden');
}

async function handleCameraDeviceChange() {
    const nextDeviceId = elements.cameraDeviceSelect.value;
    if (!nextDeviceId || nextDeviceId === cameraState.selectedDeviceId) {
        return;
    }

    cameraState.selectedDeviceId = nextDeviceId;
    resetCameraCapture();

    try {
        await startCameraStream(nextDeviceId);
    } catch (error) {
        alert(t('camera.switchFailed'));
    }
}

function captureCameraFrame() {
    const video = elements.cameraVideo;
    if (!video.videoWidth || !video.videoHeight) {
        alert(t('camera.previewNotReady'));
        return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    if (!ctx) {
        alert(t('camera.captureFailed'));
        return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    cameraState.capturedDataUrl = canvas.toDataURL('image/png');

    elements.cameraCapturedImage.src = cameraState.capturedDataUrl;
    elements.cameraCapturedImage.classList.remove('hidden');
    elements.cameraVideo.classList.add('hidden');
    elements.cameraCaptureBtn.classList.add('hidden');
    elements.cameraUseBtn.classList.remove('hidden');
    elements.cameraRetakeBtn.classList.remove('hidden');
}

function resetCameraCapture() {
    cameraState.capturedDataUrl = null;
    elements.cameraCapturedImage.src = '';
    elements.cameraCapturedImage.classList.add('hidden');
    elements.cameraVideo.classList.remove('hidden');
    elements.cameraCaptureBtn.classList.remove('hidden');
    elements.cameraUseBtn.classList.add('hidden');
    elements.cameraRetakeBtn.classList.add('hidden');
}

async function useCapturedPhoto() {
    const dataUrl = cameraState.capturedDataUrl;
    const targetCell = currentTargetCell;

    if (!dataUrl || targetCell === null) {
        return;
    }

    hideCameraOverlay();
    showLoading(t('loading.processingPhoto'));

    try {
        const persistentImg = await createPersistentImageFromDataUrl(dataUrl);
        addToSpecificCell(persistentImg, t('camera.photoTitle'), targetCell);
    } catch (error) {
        alert(t('camera.useFailed'));
    } finally {
        hideLoading();
        if (currentTargetCell === targetCell) {
            currentTargetCell = null;
        }
    }
}

function showPageSelector() {
    overlayManager.show(elements.pageSelector);
}

function hidePageSelector() {
    cancelPDFPageSelectorGeneration();
    overlayManager.hide(elements.pageSelector);
}

function showLoading(message = t('loading.title')) {
    if (!elements.loading) return; // Safety check for early calls
    overlayManager.show(elements.loading, () => {
        const loadingText = elements.loading.querySelector('p');
        if (loadingText) loadingText.textContent = message;
    });
}

function hideLoading() {
    if (!elements.loading) return; // Safety check for early calls
    overlayManager.hide(elements.loading);
}

function showStatusToast(message, duration = 2000) {
    if (statusToastTimeoutId) {
        clearTimeout(statusToastTimeoutId);
        statusToastTimeoutId = null;
    }

    if (activeStatusToast) {
        activeStatusToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'status-toast';
    const toastContent = document.createElement('div');
    toastContent.className = 'status-toast-content';
    toastContent.textContent = message;
    toast.appendChild(toastContent);
    document.body.appendChild(toast);
    activeStatusToast = toast;

    statusToastTimeoutId = setTimeout(() => {
        if (activeStatusToast === toast) {
            toast.remove();
            activeStatusToast = null;
        }
        statusToastTimeoutId = null;
    }, duration);
}

function showBitonalPopover(cellIndex, anchorRect) {
    const cellData = layoutState.cells[cellIndex];
    if (!cellData?.image) return;

    cellData.filterSettings = cellData.filterSettings || { bitonalThreshold: DEFAULT_BITONAL_THRESHOLD };
    bitonalPopoverState.cellIndex = cellIndex;
    bitonalPopoverState.anchorRect = anchorRect;

    elements.bitonalThresholdSlider.value = String(getBitonalThreshold(cellData));
    positionBitonalPopover(anchorRect);
    elements.bitonalPopover.classList.remove('hidden');
}

function positionBitonalPopover(anchorRect = bitonalPopoverState.anchorRect) {
    if (!anchorRect || !elements.bitonalPopover) return;

    const popover = elements.bitonalPopover;
    const popoverWidth = Math.min(window.innerWidth * 0.42, 220);
    const left = Math.min(
        Math.max(12, anchorRect.left + (anchorRect.width / 2) - (popoverWidth / 2)),
        window.innerWidth - popoverWidth - 12
    );
    const top = Math.max(12, anchorRect.bottom + 10);

    popover.style.left = `${left}px`;
    popover.style.top = `${top}px`;
}

function hideBitonalPopover() {
    clearBitonalLongPress();
    if (bitonalPopoverState.frameRequestId) {
        cancelAnimationFrame(bitonalPopoverState.frameRequestId);
        bitonalPopoverState.frameRequestId = null;
    }
    bitonalPopoverState.cellIndex = null;
    bitonalPopoverState.anchorRect = null;
    bitonalPopoverState.suppressNextClick = false;
    bitonalPopoverState.applying = false;
    bitonalPopoverState.pendingThreshold = null;
    if (elements.bitonalPopover) {
        elements.bitonalPopover.classList.add('hidden');
    }
}

function clearBitonalLongPress() {
    if (bitonalPopoverState.longPressTimer) {
        clearTimeout(bitonalPopoverState.longPressTimer);
        bitonalPopoverState.longPressTimer = null;
    }
}

function handleGlobalPointerDown(event) {
    if (elements.bitonalPopover?.classList.contains('hidden')) {
        return;
    }

    if (elements.bitonalPopover.contains(event.target)) {
        return;
    }

    hideBitonalPopover();
}

function handleBitonalThresholdInput() {
    const cellIndex = bitonalPopoverState.cellIndex;
    const cellData = cellIndex !== null ? layoutState.cells[cellIndex] : null;
    if (!cellData?.image) return;

    cellData.filterSettings = cellData.filterSettings || { bitonalThreshold: DEFAULT_BITONAL_THRESHOLD };
    bitonalPopoverState.pendingThreshold = Number(elements.bitonalThresholdSlider.value);

    if (bitonalPopoverState.frameRequestId) {
        return;
    }

    bitonalPopoverState.frameRequestId = requestAnimationFrame(() => {
        bitonalPopoverState.frameRequestId = null;
        applyBitonalThresholdPreview();
    });
}

async function applyBitonalThresholdPreview() {
    const cellIndex = bitonalPopoverState.cellIndex;
    const cellData = cellIndex !== null ? layoutState.cells[cellIndex] : null;
    if (!cellData?.image || cellData.filter !== 'bitonal') return;

    if (bitonalPopoverState.applying) {
        return;
    }

    const nextThreshold = bitonalPopoverState.pendingThreshold;
    if (nextThreshold === null) {
        return;
    }

    bitonalPopoverState.pendingThreshold = null;
    cellData.filterSettings = cellData.filterSettings || { bitonalThreshold: DEFAULT_BITONAL_THRESHOLD };
    cellData.filterSettings.bitonalThreshold = nextThreshold;
    bitonalPopoverState.applying = true;

    try {
        await applyCellFilter(cellIndex, 'bitonal');
    } catch (error) {
        console.error('Failed to update 1-bit threshold:', error);
    } finally {
        bitonalPopoverState.applying = false;

        if (bitonalPopoverState.pendingThreshold !== null && bitonalPopoverState.cellIndex === cellIndex) {
            applyBitonalThresholdPreview();
        }
    }
}

function bindBitonalPopoverTriggers(filterBtn, cellIndex) {
    filterBtn.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        event.stopPropagation();
        openBitonalPopoverForCell(cellIndex, filterBtn.getBoundingClientRect());
    });

    filterBtn.addEventListener('pointerdown', (event) => {
        if (event.pointerType !== 'touch') return;
        clearBitonalLongPress();
        bitonalPopoverState.longPressTimer = setTimeout(() => {
            bitonalPopoverState.suppressNextClick = true;
            openBitonalPopoverForCell(cellIndex, filterBtn.getBoundingClientRect());
        }, 450);
    });

    ['pointerup', 'pointercancel', 'pointerleave'].forEach(eventName => {
        filterBtn.addEventListener(eventName, clearBitonalLongPress);
    });
}

async function openBitonalPopoverForCell(cellIndex, anchorRect) {
    const cellData = layoutState.cells[cellIndex];
    if (!cellData?.image) return;

    if (cellData.filter !== 'bitonal') {
        try {
            await applyCellFilter(cellIndex, 'bitonal');
        } catch (error) {
            console.error('Failed to open 1-bit threshold control:', error);
            return;
        }
    }

    showBitonalPopover(cellIndex, anchorRect);
}

// OCR functionality
function updateOcrButtonState() {
    if (!elements.ocrBtn) return;

    elements.ocrBtn.disabled = ocrState.busy;
    elements.ocrBtn.classList.toggle('is-busy', ocrState.busy);
    elements.ocrBtn.classList.toggle('is-ready', ocrState.status === 'ready');
}

function scheduleOcrEnginePreload() {
    if (ocrState.preloadScheduled) {
        return;
    }

    ocrState.preloadScheduled = true;

    const scheduleIdlePreload = () => {
        const runPreload = () => {
            if (ocrState.busy) {
                return;
            }

            void preloadOcrEngine();
        };

        if (typeof window.requestIdleCallback === 'function') {
            window.requestIdleCallback(runPreload, {
                timeout: CONFIG.ocr.preloadIdleTimeoutMs
            });
            return;
        }

        setTimeout(runPreload, CONFIG.ocr.preloadDelayMs);
    };

    requestAnimationFrame(() => {
        setTimeout(scheduleIdlePreload, CONFIG.ocr.preloadDelayMs);
    });
}

async function preloadOcrEngine() {
    if (ocrState.status === 'ready') {
        return;
    }

    console.log('[OCR] Preloading OCR engine');

    try {
        await getPaddleOcrEngine();

        if (!ocrState.busy) {
            ocrState.status = 'ready';
            updateOcrButtonState();
        }

        console.log('[OCR] OCR engine preloaded');
    } catch (error) {
        console.warn('[OCR] OCR engine preload failed:', error);
    }
}

async function getPaddleOcrEngine() {
    if (!ocrState.enginePromise) {
        ocrState.enginePromise = (async () => {
            const { PaddleOCR } = await import(CONFIG.ocr.moduleUrl);
            const ocr = await PaddleOCR.create({
                textDetectionModelName: CONFIG.ocr.textDetectionModelName,
                textDetectionModelAsset: {
                    url: CONFIG.ocr.textDetectionModelUrl
                },
                textRecognitionModelName: CONFIG.ocr.textRecognitionModelName,
                textRecognitionModelAsset: {
                    url: CONFIG.ocr.textRecognitionModelUrl
                },
                textRecognitionBatchSize: CONFIG.ocr.textRecognitionBatchSize,
                worker: true,
                ortOptions: {
                    backend: 'auto',
                    wasmPaths: CONFIG.ocr.wasmPaths,
                    numThreads: 1,
                    simd: true
                }
            });

            ocrState.lastSummary = ocr.getInitializationSummary?.() || null;
            return ocr;
        })().catch(error => {
            ocrState.enginePromise = null;
            throw error;
        });
    }

    return ocrState.enginePromise;
}

function getCellOcrSignature(cellIndex) {
    const cellData = layoutState.cells[cellIndex];
    const imageBounds = getActualImageBounds(cellIndex);

    if (!cellData?.image || !imageBounds) {
        return '';
    }

    return JSON.stringify({
        imageWidth: cellData.image.width,
        imageHeight: cellData.image.height,
        imageOperationId: cellData.imageOperationId || 0,
        fillMode: cellData.fillMode || 'contain',
        transform: normalizeNumericObject(cellData.transform),
        crop: normalizeNumericObject(normalizeCellCrop(cellData.crop)),
        filter: cellData.filter || 'original',
        filterSettings: normalizeNumericObject(cellData.filterSettings),
        imageBounds: normalizeNumericObject(imageBounds)
    });
}

function normalizeNumericObject(value) {
    if (!value || typeof value !== 'object') {
        return value || null;
    }

    return Object.fromEntries(Object.entries(value).map(([key, item]) => [
        key,
        typeof item === 'number' ? Number(item.toFixed(4)) : item
    ]));
}

function normalizeOcrItems(result) {
    const imageWidth = Math.max(1, Number(result?.image?.width) || 1);
    const imageHeight = Math.max(1, Number(result?.image?.height) || 1);

    return (result?.items || [])
        .filter(item => item?.text && item.score >= CONFIG.ocr.minConfidence && Array.isArray(item.poly))
        .map(item => ({
            text: item.text,
            score: item.score,
            polyNorm: item.poly.map(point => [
                clamp(Number(point[0]) / imageWidth, 0, 1),
                clamp(Number(point[1]) / imageHeight, 0, 1)
            ])
        }))
        .filter(item => item.polyNorm.length >= 4);
}

function getOcrBackendLabel(summary) {
    const backend = summary?.backend || summary?.requestedBackend || '';
    const detProvider = summary?.providers?.det || summary?.detProvider || '';
    const recProvider = summary?.providers?.rec || summary?.recProvider || '';
    const providers = [detProvider, recProvider].filter(Boolean).join('/');

    return providers || backend || 'auto';
}

function getOcrCompletionMessage(recognizedLines) {
    if (recognizedLines === 0) {
        return t('ocr.completeNoText');
    }

    return t('ocr.completeWithText', { count: recognizedLines });
}

async function handleRunOCR() {
    if (ocrState.busy) return;

    const totalCells = appState.pages.reduce((count, page) => (
        count + page.cells.filter(isCellImageContent).length
    ), 0);

    if (!totalCells) {
        showStatusToast(t('ocr.noImages'));
        return;
    }

    ocrState.busy = true;
    ocrState.status = 'loading';
    clearOcrVisualState({ render: false });
    updateOcrButtonState();

    const originalPageIndex = appState.currentPageIndex;
    let recognizedLines = 0;
    let processedCells = 0;
    let completedSuccessfully = false;

    try {
        const ocr = await getPaddleOcrEngine();
        ocrState.status = 'ready';
        updateOcrButtonState();

        for (let pageIndex = 0; pageIndex < appState.pages.length; pageIndex++) {
            appState.currentPageIndex = pageIndex;
            renderCurrentPage();

            const cellIndices = layoutState.cells
                .map((cell, cellIndex) => (isCellImageContent(cell) ? cellIndex : null))
                .filter(cellIndex => cellIndex !== null);

            if (!cellIndices.length) {
                continue;
            }

            const renderedSheet = await renderSheetToFullCanvas(CONFIG.ocr.rasterScale);

            for (const cellIndex of cellIndices) {
                const cellData = layoutState.cells[cellIndex];
                const imageBounds = getActualImageBounds(cellIndex);

                if (!cellData?.image || !imageBounds) {
                    continue;
                }

                processedCells += 1;
                setOcrActiveCell(pageIndex, cellIndex);
                await waitForOcrScanFeedback();

                const cellCanvas = extractCellCanvasFromRenderedSheet(
                    renderedSheet,
                    imageBounds,
                    CONFIG.ocr.rasterScale
                );

                if (!cellCanvas) {
                    continue;
                }

                const signature = getCellOcrSignature(cellIndex);
                const [result] = await ocr.predict(cellCanvas);
                const items = normalizeOcrItems(result);

                cellData.ocr = {
                    engine: 'paddleocr',
                    model: CONFIG.ocr.textRecognitionModelName,
                    signature,
                    items,
                    metrics: result?.metrics || null,
                    runtime: result?.runtime || null
                };

                recognizedLines += items.length;
                appendOcrFlashItems(pageIndex, cellIndex, items);
            }
        }

        const backendLabel = getOcrBackendLabel(ocrState.lastSummary);
        console.log('[OCR] Scan complete:', {
            recognizedLines,
            processedCells,
            backend: backendLabel,
            summary: ocrState.lastSummary
        });
        completedSuccessfully = true;
        showStatusToast(getOcrCompletionMessage(recognizedLines), 3200);
    } catch (error) {
        console.error('OCR failed:', error);
        ocrState.status = 'error';
        ocrState.lastError = String(error);
        alert(t('ocr.failed'));
    } finally {
        appState.currentPageIndex = originalPageIndex;
        ocrState.activeCell = null;

        if (!completedSuccessfully || recognizedLines === 0) {
            clearOcrVisualState({ render: false });
        }

        renderCurrentPage();
        ocrState.busy = false;
        updateOcrButtonState();

        if (completedSuccessfully && recognizedLines > 0) {
            scheduleOcrFlashClear();
        }

        if (!processedCells && ocrState.status !== 'error') {
            showStatusToast(t('ocr.noExportableCells'));
        }
    }
}

// Export functionality
async function handleQualityExport(quality) {
    hideExportOverlay();
    showLoading(t('export.exporting', { quality: getExportQualityLabel(quality) }));
    
    try {
        const pdf = await assemblePDF(quality);
        downloadPDF(pdf, quality);
        hideLoading();
        showStatusToast(t('export.complete'));
    } catch (error) {
        hideLoading();
        console.error('Export failed:', error);
        alert(t('export.failed'));
    }
}

async function assemblePDF(quality) {
    const { scale, jpegQuality } = EXPORT_QUALITY[quality];
    const originalPageIndex = appState.currentPageIndex;
    const JsPDF = window.jspdf?.jsPDF;
    let pdf = null;

    if (!JsPDF) {
        throw new Error('jsPDF library not loaded');
    }

    try {
        for (let pageIndex = 0; pageIndex < appState.pages.length; pageIndex++) {
            appState.currentPageIndex = pageIndex;
            renderCurrentPage();

            const { width, height, orientation } = layoutState.sheet;
            if (!pdf) {
                pdf = new JsPDF({
                    orientation: orientation === 'landscape' ? 'l' : 'p',
                    unit: 'mm',
                    format: [width, height]
                });
            } else {
                pdf.addPage([width, height], orientation === 'landscape' ? 'l' : 'p');
            }

            showLoading(t('export.rasterizingPage', {
                current: pageIndex + 1,
                total: appState.pages.length
            }));
            const renderedSheet = await renderSheetToFullCanvas(scale);

            for (let i = 0; i < layoutState.cells.length; i++) {
                if (!layoutState.cells[i]) {
                    continue;
                }

                const imageBounds = getActualImageBounds(i);
                if (!imageBounds) {
                    continue;
                }

                const cellImageData = extractCellImageFromRenderedSheet(renderedSheet, imageBounds, scale, jpegQuality);
                if (!cellImageData) {
                    continue;
                }

                pdf.addImage(
                    cellImageData,
                    'JPEG',
                    imageBounds.x,
                    imageBounds.y,
                    imageBounds.width,
                    imageBounds.height
                );

                addCellOcrTextLayer(pdf, imageBounds, layoutState.cells[i], i);
            }
        }

        showLoading(t('export.assembling'));
        return pdf;
    } finally {
        appState.currentPageIndex = originalPageIndex;
        renderCurrentPage();
    }
}

function addCellOcrTextLayer(pdf, imageBounds, cellData, cellIndex) {
    if (!cellData?.ocr?.items?.length || cellData.ocr.signature !== getCellOcrSignature(cellIndex)) {
        return;
    }

    const previousFontSize = pdf.getFontSize();
    const previousTextColor = pdf.getTextColor?.();

    try {
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);

        for (const item of cellData.ocr.items) {
            const text = String(item.text || '').trim();
            const bounds = getNormalizedOcrBounds(item.polyNorm);

            if (!text || !bounds || bounds.width <= 0 || bounds.height <= 0) {
                continue;
            }

            const x = imageBounds.x + bounds.x * imageBounds.width;
            const y = imageBounds.y + bounds.y * imageBounds.height;
            const width = bounds.width * imageBounds.width;
            const height = bounds.height * imageBounds.height;
            const fontSizePt = clamp(height * 72 / 25.4 * 0.82, 2, 60);

            pdf.setFontSize(fontSizePt);

            const naturalTextWidth = pdf.getTextWidth(text);
            const horizontalScale = naturalTextWidth > 0
                ? clamp(width / naturalTextWidth, 0.25, 4)
                : 1;

            pdf.text(text, x, y + height * 0.82, {
                renderingMode: 'invisible',
                horizontalScale
            });
        }
    } finally {
        pdf.setFontSize(previousFontSize);
        if (previousTextColor) {
            pdf.setTextColor(previousTextColor);
        }
    }
}

function getNormalizedOcrBounds(polyNorm) {
    if (!Array.isArray(polyNorm) || polyNorm.length < 4) {
        return null;
    }

    const xs = polyNorm.map(point => point[0]);
    const ys = polyNorm.map(point => point[1]);
    const minX = clamp(Math.min(...xs), 0, 1);
    const maxX = clamp(Math.max(...xs), 0, 1);
    const minY = clamp(Math.min(...ys), 0, 1);
    const maxY = clamp(Math.max(...ys), 0, 1);

    return {
        x: minX,
        y: minY,
        width: Math.max(0, maxX - minX),
        height: Math.max(0, maxY - minY)
    };
}

async function renderSheetToFullCanvas(scale) {
    // Get the main SVG element
    const svg = elements.sheet.querySelector('svg');
    if (!svg) {
        throw new Error('SVG sheet not found');
    }
    
    // Hide UI layer temporarily
    const uiLayer = svg.querySelector('#ui-layer');
    const originalVisibility = uiLayer ? uiLayer.style.display : '';
    if (uiLayer) {
        uiLayer.style.display = 'none';
    }
    
    try {
        return await renderSVGToFullCanvas(svg, scale);
    } finally {
        // Restore UI layer visibility
        if (uiLayer) {
            uiLayer.style.display = originalVisibility;
        }
    }
}

async function renderSVGToFullCanvas(svg, scale) {
    const img = await loadImageFromSrc(serializeSVGToDataUrl(svg));
    const fullCanvas = document.createElement('canvas');
    const fullWidth = Math.round(layoutState.sheet.width * scale);
    const fullHeight = Math.round(layoutState.sheet.height * scale);
    const fullCtx = fullCanvas.getContext('2d');

    if (!fullCtx || !fullWidth || !fullHeight) {
        throw new Error('Failed to prepare full-sheet canvas');
    }

    fullCanvas.width = fullWidth;
    fullCanvas.height = fullHeight;
    fullCtx.drawImage(img, 0, 0, fullWidth, fullHeight);

    return fullCanvas;
}

function extractCellImageFromRenderedSheet(fullCanvas, cellCoords, scale, jpegQuality) {
    const cellCanvas = extractCellCanvasFromRenderedSheet(fullCanvas, cellCoords, scale);

    return cellCanvas ? cellCanvas.toDataURL('image/jpeg', jpegQuality) : null;
}

function extractCellCanvasFromRenderedSheet(fullCanvas, cellCoords, scale) {
    const targetWidth = Math.round(cellCoords.width * scale);
    const targetHeight = Math.round(cellCoords.height * scale);

    if (!targetWidth || !targetHeight) {
        return null;
    }

    const cellCanvas = document.createElement('canvas');
    cellCanvas.width = targetWidth;
    cellCanvas.height = targetHeight;

    const cellCtx = cellCanvas.getContext('2d');
    if (!cellCtx) {
        throw new Error('Failed to prepare cell canvas');
    }

    const sourceX = Math.round(cellCoords.x * scale);
    const sourceY = Math.round(cellCoords.y * scale);
    cellCtx.drawImage(
        fullCanvas,
        sourceX, sourceY, targetWidth, targetHeight,
        0, 0, targetWidth, targetHeight
    );

    return cellCanvas;
}

function serializeSVGToDataUrl(svg) {
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const cleanSvgString = svgString.includes('<?xml')
        ? svgString
        : `<?xml version="1.0" encoding="UTF-8"?>${svgString}`;

    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(cleanSvgString)}`;
}

function getGridMetrics() {
    const { cols, rows } = layoutState.grid;
    const { width, height } = layoutState.sheet;
    const gridSpacing = CONFIG.gridSpacing;
    const availableWidth = width - gridSpacing.sheetPadding.left - gridSpacing.sheetPadding.right;
    const availableHeight = height - gridSpacing.sheetPadding.top - gridSpacing.sheetPadding.bottom;
    const totalGapWidth = gridSpacing.columnGap * (cols - 1);
    const totalGapHeight = gridSpacing.rowGap * (rows - 1);

    return {
        width,
        height,
        cols,
        rows,
        totalCells: rows * cols,
        gridSpacing,
        cellWidth: (availableWidth - totalGapWidth) / cols,
        cellHeight: (availableHeight - totalGapHeight) / rows
    };
}

function getCellCoordinates(cellIndex) {
    const { cols, gridSpacing, cellWidth, cellHeight } = getGridMetrics();
    const col = cellIndex % cols;
    const row = Math.floor(cellIndex / cols);

    return {
        x: gridSpacing.sheetPadding.left + col * (cellWidth + gridSpacing.columnGap),
        y: gridSpacing.sheetPadding.top + row * (cellHeight + gridSpacing.rowGap),
        width: cellWidth,
        height: cellHeight
    };
}

function getCellContentCoordinates(cellIndex) {
    const cellCoords = getCellCoordinates(cellIndex);
    const { cellPadding } = CONFIG.gridSpacing;

    return getContentRectFromCellBounds(cellCoords.x, cellCoords.y, cellCoords.width, cellCoords.height, cellPadding);
}

function getActualImageBounds(cellIndex) {
    const cellData = layoutState.cells[cellIndex];
    if (!cellData?.image) return null;
    
    const contentCoords = getCellContentCoordinates(cellIndex);
    const cropCoords = getCroppedContentRect(cellData, contentCoords);
    const imageGeometry = getCellImageGeometry(cellData, contentCoords);

    if (!imageGeometry) return null;

    return intersectRects(imageGeometry.visibleRect, cropCoords);
}

function downloadPDF(pdf, quality) {
    const filename = `PDFomator ${quality}.pdf`;
    
    showLoading(t('export.preparingDownload'));
    pdf.save(filename);
}
