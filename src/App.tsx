import React, { useState, useCallback, useRef, useMemo } from "react";
import { Stage, Layer, Image as KonvaImage, Line } from "react-konva";
import useImage from "use-image";
import {
  FaSun,
  FaMoon,
  FaPlus,
  FaList,
  FaTools,
  FaCheckCircle,
  FaCheck,
  FaChartBar,
  FaUndo,
  FaEraser,
  FaHighlighter,
  FaHardHat,
  FaEnvelope,
  FaTasks,
  FaTrash,
  FaEdit,
} from "react-icons/fa";
import PlacesAutocomplete, {
  geocodeByAddress,
  getLatLng,
} from "react-places-autocomplete";
import Script from "react-load-script";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Composant Modal pour l'annotation des images
const ModalAnnotation = ({ photo, onClose, onSave, themeSombre }) => {
  const [image] = useImage(photo.contenu);
  const [annotations, setAnnotations] = useState(photo.annotations || []);
  const isDrawing = useRef(false);
  const stageRef = useRef(null);
  const [tool, setTool] = useState("pen"); // 'pen', 'gomme', 'surligneur'

  const handleMouseDown = (e) => {
    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();
    setAnnotations((prevAnnotations) => [
      ...prevAnnotations,
      { tool, points: [pos.x, pos.y] },
    ]);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing.current) return;
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    let lastAnnotation = annotations[annotations.length - 1];
    lastAnnotation.points = lastAnnotation.points.concat([point.x, point.y]);
    annotations.splice(annotations.length - 1, 1, lastAnnotation);
    setAnnotations(annotations.concat());
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  const handleUndo = () => {
    setAnnotations((prevAnnotations) => prevAnnotations.slice(0, -1));
  };

  const handleSave = () => {
    const uri = stageRef.current.toDataURL();
    onSave(uri, annotations);
  };

  const handleErase = () => {
    setTool("gomme");
  };

  const handleHighlight = () => {
    setTool("surligneur");
  };

  const handlePen = () => {
    setTool("pen");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-2">
      <div
        className={`bg-gray-800 p-4 rounded shadow-lg relative w-full max-w-3xl`}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-2xl focus:outline-none"
          aria-label="Fermer l'annotation"
        >
          ×
        </button>
        {/* Outils d'annotation */}
        <div className="flex space-x-2 mb-4">
          <button
            onClick={handlePen}
            className={`p-2 rounded ${
              tool === "pen"
                ? "bg-yellow-500 text-black"
                : "bg-gray-700 text-gray-200"
            } hover:bg-yellow-400 transition-colors flex items-center`}
            title="Outil Stylo"
          >
            <FaSun className="mr-1" /> Stylo
          </button>
          <button
            onClick={handleErase}
            className={`p-2 rounded ${
              tool === "gomme"
                ? "bg-yellow-500 text-black"
                : "bg-gray-700 text-gray-200"
            } hover:bg-yellow-400 transition-colors flex items-center`}
            title="Outil Gomme"
          >
            <FaEraser className="mr-1" /> Gomme
          </button>
          <button
            onClick={handleHighlight}
            className={`p-2 rounded ${
              tool === "surligneur"
                ? "bg-yellow-500 text-black"
                : "bg-gray-700 text-gray-200"
            } hover:bg-yellow-400 transition-colors flex items-center`}
            title="Outil Surligneur"
          >
            <FaHighlighter className="mr-1" /> Surligneur
          </button>
          <button
            onClick={handleUndo}
            className="p-2 rounded bg-gray-700 text-gray-200 hover:bg-gray-600 transition-colors flex items-center"
            title="Annuler"
          >
            <FaUndo className="mr-1" /> Annuler
          </button>
        </div>
        <Stage
          width={window.innerWidth * 0.8}
          height={window.innerHeight * 0.6}
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
          onMousemove={handleMouseMove}
          onTouchMove={handleMouseMove}
          onMouseup={handleMouseUp}
          onTouchEnd={handleMouseUp}
          ref={stageRef}
          className="border-4 border-yellow-500 rounded"
        >
          <Layer>
            <KonvaImage
              image={image}
              width={window.innerWidth * 0.8}
              height={window.innerHeight * 0.6}
            />
            {annotations.map((ann, i) => (
              <Line
                key={i}
                points={ann.points}
                stroke={
                  ann.tool === "pen"
                    ? "#FF4500" // Orange pour le stylo
                    : ann.tool === "surligneur"
                    ? "yellow"
                    : "white"
                }
                strokeWidth={ann.tool === "gomme" ? 20 : 4}
                tension={0.5}
                lineCap="round"
                globalCompositeOperation={
                  ann.tool === "gomme" ? "destination-out" : "source-over"
                }
              />
            ))}
          </Layer>
        </Stage>
        <div className="flex justify-between mt-4">
          <button
            onClick={handleUndo}
            className="bg-gray-700 text-gray-200 p-2 rounded hover:bg-gray-600 transition-colors flex items-center"
            title="Annuler la dernière action"
          >
            <FaUndo className="mr-1" /> Annuler
          </button>
          <button
            onClick={handleSave}
            className="bg-yellow-500 text-black p-2 rounded hover:bg-yellow-400 transition-colors flex items-center"
            title="Enregistrer les annotations"
          >
            <FaCheck className="mr-1" /> Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
};

const AppGestionChantiers = () => {
  const [projets, setProjets] = useState([]);
  const [dossierTravaux, setDossierTravaux] = useState([]);
  const [projetsTermines, setProjetsTermines] = useState([]);
  const [projetActif, setProjetActif] = useState(null);
  const [notification, setNotification] = useState(null);
  const [recherche, setRecherche] = useState("");
  const [filtreCommercial, setFiltreCommercial] = useState("");
  const [ongletActif, setOngletActif] = useState("nouveauProjet");
  const [annotationImage, setAnnotationImage] = useState(null);
  const [themeSombre, setThemeSombre] = useState(true);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [taches, setTaches] = useState([]);

  // État pour le gestionnaire de tâches

  // Fonction pour gérer le chargement du script Google Maps
  const handleScriptLoad = () => {
    setGoogleMapsLoaded(true);
    afficherNotification("Google Maps chargé avec succès", "success");
  };

  // Fonction pour gérer les erreurs de chargement du script Google Maps
  const handleScriptError = () => {
    afficherNotification(
      "Erreur lors du chargement de l'API Google Maps. Veuillez vérifier votre clé API.",
      "error"
    );
  };

  const afficherNotification = useCallback((message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const modifierProjet = useCallback(
    (id, modifications) => {
      const modifier = (liste) =>
        liste.map((projet) =>
          projet.id === id ? { ...projet, ...modifications } : projet
        );
      setProjets((prevProjets) => modifier(prevProjets));
      setDossierTravaux((prevDossierTravaux) => modifier(prevDossierTravaux));
      setProjetsTermines((prevProjetsTermines) =>
        modifier(prevProjetsTermines)
      );
      setProjetActif((prevProjetActif) =>
        prevProjetActif && prevProjetActif.id === id
          ? { ...prevProjetActif, ...modifications }
          : prevProjetActif
      );
      afficherNotification("Projet modifié avec succès", "success");
    },
    [afficherNotification]
  );

  const marquerCommeCommande = useCallback(
    (projet) => {
      const projetCommande = {
        ...projet,
        commandeConfirmee: true,
        avancement: 0,
        etapes: {}, // Initialisation des étapes
        montantHT: 0,
        devisNumber: "",
        clientNumber: "",
        equipmentType: "",
        datePrevisionnelle: new Date(),
      };
      setDossierTravaux((prevDossierTravaux) => [
        ...prevDossierTravaux,
        projetCommande,
      ]);
      setProjets((prevProjets) =>
        prevProjets.filter((p) => p.id !== projet.id)
      );
      setProjetActif(projetCommande);
      afficherNotification("Le projet a été marqué comme commandé", "success");
    },
    [afficherNotification]
  );

  const filtrerProjets = useCallback(
    (liste) => {
      return liste.filter(
        (projet) =>
          projet.nom.toLowerCase().includes(recherche.toLowerCase()) &&
          (filtreCommercial === "" || projet.commercial === filtreCommercial)
      );
    },
    [recherche, filtreCommercial]
  );

  const ajouterProjet = () => {
    const nouveauProjet = {
      id: Date.now(),
      nom: "",
      client: "",
      nomSociete: "",
      emailClient: "",
      telephoneClient: "",
      numeroRue: "",
      adresse: "",
      codePostal: "",
      ville: "",
      commercial: "",
      notes: [],
      photos: [],
      piecesJointes: [],
      commandeConfirmee: false,
      devisNumber: "",
      clientNumber: "",
      equipmentType: "",
      montantHT: 0,
      datePrevisionnelle: null,
      avancement: 0,
    };
    setProjets((prev) => [...prev, nouveauProjet]);
    setProjetActif(nouveauProjet);
    setOngletActif("detailsProjet");
    afficherNotification("Projet créé avec succès", "success");
  };

  const supprimerProjet = useCallback(
    (id) => {
      if (window.confirm("Êtes-vous sûr de vouloir supprimer ce projet ?")) {
        setProjets((prev) => prev.filter((projet) => projet.id !== id));
        setDossierTravaux((prev) => prev.filter((projet) => projet.id !== id));
        setProjetsTermines((prev) => prev.filter((projet) => projet.id !== id));
        if (projetActif && projetActif.id === id) {
          setProjetActif(null);
        }
        afficherNotification("Projet supprimé", "success");
      }
    },
    [projetActif, afficherNotification]
  );

  const ajouterPhoto = useCallback(
    (e) => {
      const fichiers = e.target.files;
      const nouvellesPhotos = [];
      let chargementTermine = 0;
      Array.from(fichiers).forEach((fichier, index) => {
        const lecteur = new FileReader();
        lecteur.onload = (event) => {
          const photo = {
            id: Date.now() + index,
            nom: fichier.name,
            contenu: event.target.result,
          };
          nouvellesPhotos.push(photo);
          chargementTermine += 1;
          if (chargementTermine === fichiers.length) {
            modifierProjet(projetActif.id, {
              photos: [...(projetActif.photos || []), ...nouvellesPhotos],
            });
            ouvrirAnnotation(nouvellesPhotos[0]); // Ouvre l'annotation pour la première photo ajoutée
          }
        };
        lecteur.readAsDataURL(fichier);
      });
    },
    [modifierProjet, projetActif]
  );

  const ajouterNoteAutomatique = useCallback(
    (e) => {
      const contenu = e.target.value;
      if (contenu.trim() !== "") {
        const nouvelleNote = {
          id: Date.now(),
          contenu,
          date: new Date().toLocaleString(),
        };
        modifierProjet(projetActif.id, {
          notes: [...(projetActif.notes || []), nouvelleNote],
        });
        e.target.value = "";
      }
    },
    [modifierProjet, projetActif]
  );

  const ajouterPieceJointe = useCallback(
    (e) => {
      const fichiers = e.target.files;
      const nouvellesPiecesJointes = [];
      let chargementTermine = 0;
      Array.from(fichiers).forEach((fichier, index) => {
        const lecteur = new FileReader();
        lecteur.onload = (event) => {
          nouvellesPiecesJointes.push({
            nom: fichier.name,
            contenu: event.target.result,
          });
          chargementTermine += 1;
          if (chargementTermine === fichiers.length) {
            modifierProjet(projetActif.id, {
              piecesJointes: [
                ...(projetActif.piecesJointes || []),
                ...nouvellesPiecesJointes,
              ],
            });
          }
        };
        lecteur.readAsDataURL(fichier);
      });
    },
    [modifierProjet, projetActif]
  );

  const obtenirAdresseActuelle = useCallback(() => {
    if (!navigator.geolocation) {
      afficherNotification(
        "La géolocalisation n'est pas supportée par votre navigateur",
        "error"
      );
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
        )
          .then((response) => response.json())
          .then((data) => {
            if (data && data.address) {
              const { road, house_number, postcode, city } = data.address;
              modifierProjet(projetActif.id, {
                adresse: road || "",
                numeroRue: house_number || "",
                codePostal: postcode || "",
                ville: city || "",
              });
              afficherNotification("Adresse récupérée avec succès", "success");
            } else {
              afficherNotification("Impossible d'obtenir l'adresse", "error");
            }
          })
          .catch(() => {
            afficherNotification(
              "Erreur lors de la récupération de l'adresse",
              "error"
            );
          });
      },
      () => {
        afficherNotification("Impossible d'obtenir votre position", "error");
      }
    );
  }, [modifierProjet, projetActif, afficherNotification]);

  const ouvrirAnnotation = useCallback((photo) => {
    setAnnotationImage(photo);
  }, []);

  const fermerAnnotation = useCallback(() => {
    setAnnotationImage(null);
  }, []);

  const basculerTheme = useCallback(() => {
    setThemeSombre((prev) => !prev);
  }, []);

  const estChampRempli = useCallback((valeur) => {
    return valeur && valeur.toString().trim() !== "";
  }, []);

  const gererAvancement = useCallback(
    (valeur) => {
      modifierProjet(projetActif.id, { avancement: valeur });
    },
    [modifierProjet, projetActif]
  );

  const gererEtapeChantier = useCallback(
    (etape, propriete, valeur) => {
      const nouvellesEtapes = {
        ...projetActif.etapes,
        [etape]: {
          ...projetActif.etapes[etape],
          [propriete]: valeur,
        },
      };

      let projetMiseAJour = { etapes: nouvellesEtapes };

      if (
        etape === "pvReceptionValide" &&
        propriete === "checked" &&
        valeur === true
      ) {
        // Déplacer le projet vers "Chantiers Terminés"
        projetMiseAJour.dateFin = new Date().toLocaleString();
        setProjetsTermines((prev) => [
          ...prev,
          { ...projetActif, ...projetMiseAJour },
        ]);
        setDossierTravaux((prev) =>
          prev.filter((projet) => projet.id !== projetActif.id)
        );
        setProjetActif({ ...projetActif, ...projetMiseAJour });
        afficherNotification("Le projet a été marqué comme terminé", "success");
      } else {
        // Mettre à jour le projet avec les nouvelles étapes
        modifierProjet(projetActif.id, projetMiseAJour);
      }
    },
    [modifierProjet, projetActif]
  );

  const calculerStatistiques = useMemo(() => {
    const totalProjets =
      projets.length + dossierTravaux.length + projetsTermines.length;
    const totalParCommercial = {};
    const totalMontantParCommercial = {};
    const projetsTous = [...projets, ...dossierTravaux, ...projetsTermines];
    projetsTous.forEach((projet) => {
      if (projet.commercial) {
        totalParCommercial[projet.commercial] =
          (totalParCommercial[projet.commercial] || 0) + 1;
        if (projet.commandeConfirmee && projet.montantHT) {
          totalMontantParCommercial[projet.commercial] =
            (totalMontantParCommercial[projet.commercial] || 0) +
            projet.montantHT;
        }
      }
    });
    return {
      totalProjets,
      totalParCommercial,
      totalMontantParCommercial,
    };
  }, [projets, dossierTravaux, projetsTermines]);

  const envoyerEmail = useCallback(() => {
    if (!projetActif) {
      afficherNotification("Aucun projet actif sélectionné.", "error");
      return;
    }
    const sujet = encodeURIComponent(
      `Demande de création de numéro client - ${projetActif.nom || "N/A"}`
    );
    const corps = encodeURIComponent(`Bonjour,
  
  Pourriez-vous créer le numéro client site et payeur suivant ?
  
  - Nom du projet : ${projetActif.nom || "N/A"}
  - Nom du client : ${projetActif.client || "N/A"}
  - Nom de la société : ${projetActif.nomSociete || "N/A"}
  - Adresse : ${projetActif.numeroRue || ""} ${projetActif.adresse || ""}, ${
      projetActif.codePostal || ""
    } ${projetActif.ville || ""}
  - Numéro de téléphone : ${projetActif.telephoneClient || "N/A"}
  - Adresse e-mail : ${projetActif.emailClient || "N/A"}
  
  Merci d'avance.
  
  Cordialement,
  ${projetActif.commercial || "N/A"}`);

    // Remplacez par l'adresse e-mail du destinataire réel
    const mailtoLink = `LABONNEADRESSE.COM?subject=${sujet}&body=${corps}`;
    window.location.href = mailtoLink;
  }, [projetActif, afficherNotification]);

  // Gestion des tâches
  const ajouterTache = (tache) => {
    setTaches((prevTaches) => [...prevTaches, { ...tache, id: Date.now() }]);
    afficherNotification("Tâche ajoutée avec succès", "success");
  };

  const modifierTache = (id, modifications) => {
    setTaches((prevTaches) =>
      prevTaches.map((tache) =>
        tache.id === id ? { ...tache, ...modifications } : tache
      )
    );
    afficherNotification("Tâche modifiée avec succès", "success");
  };

  const supprimerTache = (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette tâche ?")) {
      setTaches((prevTaches) => prevTaches.filter((tache) => tache.id !== id));
      afficherNotification("Tâche supprimée", "success");
    }
  };

  return (
    <div
      className={`flex flex-col h-screen ${
        themeSombre ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
      }`}
      style={{
        backgroundImage: themeSombre
          ? "url('/images/construction-dark.jpg')"
          : "url('/images/construction-light.jpg')",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      }}
    >
      {/* Chargement du script Google Maps */}
      <Script
        url={`https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places`}
        onLoad={handleScriptLoad}
        onError={handleScriptError}
      />
      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 w-64 p-4 rounded shadow ${
            notification.type === "success"
              ? "bg-green-500 text-white"
              : "bg-red-600 text-white"
          } z-50`}
        >
          <strong className="block mb-2">
            {notification.type === "success" ? "Succès" : "Erreur"}
          </strong>
          <p>{notification.message}</p>
        </div>
      )}
      {/* Barre de navigation */}
      <nav
        className={`flex items-center justify-between p-4 ${
          themeSombre ? "bg-gray-800 bg-opacity-80" : "bg-white bg-opacity-90"
        } shadow-md`}
      >
        <div className="flex items-center">
          <FaHardHat className="text-yellow-400 text-3xl mr-2" />{" "}
          {/* Icône Thématique */}
          <h1 className="text-2xl font-bold">Gestion des Chantiers</h1>
        </div>
        <div className="flex flex-wrap">
          <button
            onClick={() => {
              setOngletActif("nouveauProjet");
              setProjetActif(null);
            }}
            className={`p-2 mr-2 mb-2 rounded flex items-center ${
              ongletActif === "nouveauProjet"
                ? "bg-yellow-500 text-black"
                : themeSombre
                ? "bg-gray-700 text-gray-200"
                : "bg-gray-200 text-gray-700"
            } hover:bg-yellow-400 transition-colors`}
          >
            <FaPlus className="mr-1" /> Nouveau Projet
          </button>
          <button
            onClick={() => {
              setOngletActif("listeProjets");
              setProjetActif(null);
            }}
            className={`p-2 mr-2 mb-2 rounded flex items-center ${
              ongletActif === "listeProjets"
                ? "bg-yellow-500 text-black"
                : themeSombre
                ? "bg-gray-700 text-gray-200"
                : "bg-gray-200 text-gray-700"
            } hover:bg-yellow-400 transition-colors`}
          >
            <FaList className="mr-1" /> Liste des Projets
          </button>
          <button
            onClick={() => {
              setOngletActif("dossierTravaux");
              setProjetActif(null);
            }}
            className={`p-2 mr-2 mb-2 rounded flex items-center ${
              ongletActif === "dossierTravaux"
                ? "bg-yellow-500 text-black"
                : themeSombre
                ? "bg-gray-700 text-gray-200"
                : "bg-gray-200 text-gray-700"
            } hover:bg-yellow-400 transition-colors`}
          >
            <FaTools className="mr-1" /> Dossier Travaux
          </button>
          <button
            onClick={() => {
              setOngletActif("chantiersTermines");
              setProjetActif(null);
            }}
            className={`p-2 mr-2 mb-2 rounded flex items-center ${
              ongletActif === "chantiersTermines"
                ? "bg-yellow-500 text-black"
                : themeSombre
                ? "bg-gray-700 text-gray-200"
                : "bg-gray-200 text-gray-700"
            } hover:bg-yellow-400 transition-colors`}
          >
            <FaCheck className="mr-1" /> Chantiers Terminés
          </button>
          <button
            onClick={() => {
              setOngletActif("statistiques");
              setProjetActif(null);
            }}
            className={`p-2 mr-2 mb-2 rounded flex items-center ${
              ongletActif === "statistiques"
                ? "bg-yellow-500 text-black"
                : themeSombre
                ? "bg-gray-700 text-gray-200"
                : "bg-gray-200 text-gray-700"
            } hover:bg-yellow-400 transition-colors`}
          >
            <FaChartBar className="mr-1" /> Statistiques
          </button>
          <button
            onClick={() => {
              setOngletActif("gestionnaireTaches");
              setProjetActif(null);
            }}
            className={`p-2 mr-2 mb-2 rounded flex items-center ${
              ongletActif === "gestionnaireTaches"
                ? "bg-yellow-500 text-black"
                : themeSombre
                ? "bg-gray-700 text-gray-200"
                : "bg-gray-200 text-gray-700"
            } hover:bg-yellow-400 transition-colors`}
          >
            <FaTasks className="mr-1" /> Gestionnaire de Tâches
          </button>
        </div>
        <button
          onClick={basculerTheme}
          className="p-2 rounded-full hover:bg-gray-500 transition-colors"
          title="Basculer le thème"
        >
          {themeSombre ? (
            <FaSun className="text-yellow-400" />
          ) : (
            <FaMoon className="text-gray-800" />
          )}
        </button>
      </nav>
      <div className="flex flex-1 overflow-hidden">
        {/* Contenu en fonction de l'onglet actif */}
        {ongletActif === "nouveauProjet" && (
          <div className="w-full flex items-center justify-center p-4">
            <button
              onClick={ajouterProjet}
              className="bg-yellow-500 text-black rounded-full hover:bg-yellow-400 shadow-lg transform hover:scale-110 transition-transform flex items-center justify-center"
              style={{
                width: "200px",
                height: "100px",
                fontSize: "20px",
                border: "100px solid #8895243",
              }}
              title="Ajouter un nouveau projet"
            >
              Cliquer ici pour ouvrir un nouveau projet +
            </button>
          </div>
        )}
        {(ongletActif === "listeProjets" ||
          ongletActif === "dossierTravaux" ||
          ongletActif === "chantiersTermines") && (
          <div className="w-full overflow-auto p-4">
            <h2 className="text-3xl font-bold mb-4 text-white-500">
              {ongletActif === "listeProjets"
                ? "Liste des Projets"
                : ongletActif === "dossierTravaux"
                ? "Dossier Travaux"
                : "Chantiers Terminés"}
            </h2>
            {/* Recherche et filtre */}
            <div className="mb-4 flex flex-col md:flex-row gap-2">
              <input
                type="text"
                placeholder="Rechercher..."
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                className={`w-full p-2 border rounded ${
                  themeSombre
                    ? "bg-gray-800 text-white placeholder-gray-400"
                    : "bg-gray-200 text-gray-900 placeholder-gray-500"
                }`}
              />
              <select
                value={filtreCommercial}
                onChange={(e) => setFiltreCommercial(e.target.value)}
                className={`w-full p-2 border rounded ${
                  themeSombre
                    ? "bg-gray-800 text-white"
                    : "bg-gray-200 text-gray-900"
                }`}
              >
                <option value="">Tous les commerciaux</option>
                <option value="MATHIS DELOLMO">MATHIS DELOLMO</option>
                <option value="ALEXANDRE MARQUES">ALEXANDRE MARQUES</option>
                <option value="ELIOT DELOLMO">ELIOT DELOLMO</option>
              </select>
            </div>
            {/* Liste des projets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtrerProjets(
                ongletActif === "listeProjets"
                  ? projets
                  : ongletActif === "dossierTravaux"
                  ? dossierTravaux
                  : projetsTermines
              ).map((projet) => (
                <button
                  key={projet.id}
                  className={`p-4 rounded shadow-lg hover:bg-yellow-500 hover:text-black transition-colors relative ${
                    themeSombre
                      ? "bg-gray-700 text-white"
                      : "bg-gray-200 text-gray-900"
                  } ${
                    projet.etapes && projet.etapes.pvReceptionValide
                      ? "border-4 border-green-500"
                      : ""
                  }`}
                  onClick={() => {
                    setProjetActif(projet);
                    setOngletActif("detailsProjet");
                  }}
                  title={`Voir les détails du projet ${projet.nom}`}
                >
                  <h3 className="text-xl font-semibold mb-2">
                    {projet.nom || "Projet sans nom"}
                  </h3>
                  <p className="text-sm">Client : {projet.client || "N/A"}</p>
                  <p className="text-sm">
                    Commercial : {projet.commercial || "N/A"}
                  </p>
                  {projet.etapes && projet.etapes.pvReceptionValide && (
                    <span className="absolute top-2 right-2 text-green-500">
                      <FaCheckCircle />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
        {ongletActif === "statistiques" && (
          <div className="w-full overflow-auto p-4">
            <h2 className="text-3xl font-bold mb-4 text-yellow-500">
              Statistiques
            </h2>
            {/* Affichage des statistiques */}
            <div className="space-y-6">
              <div className="bg-yellow-500 p-4 shadow rounded">
                <h3 className="text-xl font-semibold mb-2">
                  Total de projets :
                </h3>
                <p className="text-2xl">{calculerStatistiques.totalProjets}</p>
              </div>
              <div className="bg-yellow-500 p-4 rounded shadow">
                <h3 className="text-xl font-semibold mb-2">
                  Projets par commercial :
                </h3>
                <ul className="list-disc list-inside">
                  {Object.entries(calculerStatistiques.totalParCommercial).map(
                    ([commercial, total], index) => (
                      <li key={index}>
                        {commercial} : {total}
                      </li>
                    )
                  )}
                </ul>
              </div>
              <div className="bg-yellow-500 p-4 rounded shadow">
                <h3 className="text-xl font-semibold mb-2">
                  Montant total HT par commercial :
                </h3>
                <ul className="list-disc list-inside">
                  {Object.entries(
                    calculerStatistiques.totalMontantParCommercial
                  ).map(([commercial, montant], index) => (
                    <li key={index}>
                      {commercial} : {montant.toFixed(2)} €
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
        {ongletActif === "gestionnaireTaches" && (
          <div className="w-full overflow-auto p-4">
            <h2 className="text-3xl font-bold mb-4 text-yellow-500">
              Gestionnaire de Tâches
            </h2>
            {/* Formulaire d'ajout de tâche */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target;
                const nouvelleTache = {
                  titre: form.titre.value,
                  description: form.description.value,
                  dateEcheance: form.dateEcheance.value,
                  statut: "À faire",
                };
                ajouterTache(nouvelleTache);
                form.reset();
              }}
              className="mb-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  name="titre"
                  type="text"
                  placeholder="Titre de la tâche"
                  required
                  className={`w-full p-2 border rounded ${
                    themeSombre
                      ? "bg-gray-800 text-white placeholder-gray-400"
                      : "bg-gray-200 text-gray-900 placeholder-gray-500"
                  }`}
                />
                <input
                  name="dateEcheance"
                  type="date"
                  className={`w-full p-2 border rounded ${
                    themeSombre
                      ? "bg-gray-800 text-white placeholder-gray-400"
                      : "bg-gray-200 text-gray-900 placeholder-gray-500"
                  }`}
                />
              </div>
              <textarea
                name="description"
                placeholder="Description de la tâche"
                className={`w-full p-2 border rounded mt-2 ${
                  themeSombre
                    ? "bg-gray-800 text-white placeholder-gray-400"
                    : "bg-gray-200 text-gray-900 placeholder-gray-500"
                }`}
              ></textarea>
              <button
                type="submit"
                className="mt-2 bg-yellow-500 text-black p-2 rounded hover:bg-yellow-400 transition-colors flex items-center"
              >
                <FaPlus className="mr-1" /> Ajouter Tâche
              </button>
            </form>
            {/* Liste des tâches */}
            <div className="space-y-4">
              {taches.map((tache) => (
                <div
                  key={tache.id}
                  className={`p-4 rounded shadow ${
                    themeSombre ? "bg-gray-800" : "bg-gray-200"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold">{tache.titre}</h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() =>
                          modifierTache(tache.id, {
                            statut:
                              tache.statut === "Terminé"
                                ? "À faire"
                                : "Terminé",
                          })
                        }
                        className={`p-2 rounded ${
                          tache.statut === "Terminé"
                            ? "bg-green-500 text-white"
                            : "bg-gray-500 text-white"
                        }`}
                      >
                        {tache.statut === "Terminé" ? <FaCheck /> : <FaUndo />}
                      </button>
                      <button
                        onClick={() => supprimerTache(tache.id)}
                        className="p-2 rounded bg-red-600 text-white"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  <p className="mt-2">{tache.description}</p>
                  {tache.dateEcheance && (
                    <p className="mt-1 text-sm">
                      Date d'échéance : {tache.dateEcheance}
                    </p>
                  )}
                  <p className="mt-1 text-sm">Statut : {tache.statut}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {ongletActif === "detailsProjet" && projetActif && (
          <div
            className={`flex-1 overflow-auto p-4 ${
              themeSombre
                ? "bg-gray-800 bg-opacity-50"
                : "bg-white bg-opacity-50"
            }`}
          >
            <h2 className="text-3xl font-bold mb-4 text-white-400">
              {projetActif.nom || "Nouveau Projet"}
            </h2>
            {/* Formulaire pour les détails du projet */}

            <h3 className="text-2xl font-bold mb-2 text-yellow-400">
              Information client site
            </h3>
            <div className="mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Champ Nom du projet */}
                <label className="block mb-2 relative">
                  {estChampRempli(projetActif.nom) && (
                    <FaCheckCircle className="absolute top-0 right-0 text-green-500" />
                  )}
                  <input
                    type="text"
                    value={projetActif.nom}
                    onChange={(e) =>
                      modifierProjet(projetActif.id, { nom: e.target.value })
                    }
                    className={`w-full p-3 border rounded mt-1 ${
                      themeSombre
                        ? "bg-gray-700 text-white placeholder-gray-400"
                        : "bg-gray-200 text-gray-900 placeholder-gray-500"
                    }`}
                    placeholder="Nom du projet"
                  />
                </label>
                {/* Champ Nom du client */}
                <label className="block mb-2 relative">
                  {estChampRempli(projetActif.client) && (
                    <FaCheckCircle className="absolute top-0 right-0 text-green-500" />
                  )}
                  <input
                    type="text"
                    value={projetActif.client || ""}
                    onChange={(e) =>
                      modifierProjet(projetActif.id, { client: e.target.value })
                    }
                    className={`w-full p-3 border rounded mt-1 ${
                      themeSombre
                        ? "bg-gray-700 text-white placeholder-gray-400"
                        : "bg-gray-200 text-gray-900 placeholder-gray-500"
                    }`}
                    placeholder="Prénom / Nom du client"
                  />
                </label>
                {/* Champ Nom de la société */}
                <label className="block mb-2 relative">
                  {estChampRempli(projetActif.nomSociete) && (
                    <FaCheckCircle className="absolute top-0 right-0 text-green-500" />
                  )}
                  <input
                    type="text"
                    value={projetActif.nomSociete || ""}
                    onChange={(e) =>
                      modifierProjet(projetActif.id, {
                        nomSociete: e.target.value,
                      })
                    }
                    className={`w-full p-3 border rounded mt-1 ${
                      themeSombre
                        ? "bg-gray-700 text-white placeholder-gray-400"
                        : "bg-gray-200 text-gray-900 placeholder-gray-500"
                    }`}
                    placeholder="Nom de la société"
                  />
                </label>
                {/* Champ Adresse e-mail */}
                <label className="block mb-2 relative">
                  {estChampRempli(projetActif.emailClient) && (
                    <FaCheckCircle className="absolute top-0 right-0 text-green-500" />
                  )}
                  <input
                    type="email"
                    value={projetActif.emailClient || ""}
                    onChange={(e) =>
                      modifierProjet(projetActif.id, {
                        emailClient: e.target.value,
                      })
                    }
                    className={`w-full p-3 border rounded mt-1 ${
                      themeSombre
                        ? "bg-gray-700 text-white placeholder-gray-400"
                        : "bg-gray-200 text-gray-900 placeholder-gray-500"
                    }`}
                    placeholder="Adresse e-mail du client"
                  />
                </label>
                {/* Champ Numéro de téléphone */}
                <label className="block mb-2 relative">
                  {estChampRempli(projetActif.telephoneClient) && (
                    <FaCheckCircle className="absolute top-0 right-0 text-green-500" />
                  )}
                  <input
                    type="tel"
                    value={projetActif.telephoneClient || ""}
                    onChange={(e) =>
                      modifierProjet(projetActif.id, {
                        telephoneClient: e.target.value,
                      })
                    }
                    className={`w-full p-3 border rounded mt-1 ${
                      themeSombre
                        ? "bg-gray-700 text-white placeholder-gray-400"
                        : "bg-gray-200 text-gray-900 placeholder-gray-500"
                    }`}
                    placeholder="N° Téléphone"
                  />
                </label>
                {/* Bouton pour obtenir l'adresse actuelle */}
                <button
                  onClick={obtenirAdresseActuelle}
                  className="bg-yellow-500 text-black p-3 rounded hover:bg-yellow-400 transition-colors flex items-center"
                >
                  <FaSun className="mr-1" /> Obtenir l'adresse actuelle
                </button>
                {/* Champ Adresse avec Autocomplete */}
                {googleMapsLoaded ? (
                  <PlacesAutocomplete
                    value={projetActif.adresse || ""}
                    onChange={(adresse) =>
                      modifierProjet(projetActif.id, { adresse })
                    }
                    onSelect={(adresse) => {
                      geocodeByAddress(adresse)
                        .then((results) => getLatLng(results[0]))
                        .then((latLng) => {
                          modifierProjet(projetActif.id, {
                            adresse,
                            latitude: latLng.lat,
                            longitude: latLng.lng,
                          });
                        })
                        .catch((erreur) => console.error("Erreur", erreur));
                    }}
                  >
                    {({
                      getInputProps,
                      suggestions,
                      getSuggestionItemProps,
                      loading,
                    }) => (
                      <div className="block mb-2 relative">
                        <span className="block mb-1">Adresse :</span>
                        <input
                          {...getInputProps({
                            placeholder: "Adresse complète",
                            className: `w-full p-3 border rounded mt-1 ${
                              themeSombre
                                ? "bg-gray-700 text-white placeholder-gray-400"
                                : "bg-gray-200 text-gray-900 placeholder-gray-500"
                            }`,
                          })}
                        />
                        <div className="absolute bg-white border rounded mt-1 w-full z-10">
                          {loading && <div className="p-2">Chargement...</div>}
                          {suggestions.map((suggestion, index) => {
                            const className = suggestion.active
                              ? "bg-yellow-500 text-black p-2 cursor-pointer"
                              : "p-2 cursor-pointer";
                            return (
                              <div
                                key={index}
                                {...getSuggestionItemProps(suggestion, {
                                  className,
                                })}
                              >
                                <span>{suggestion.description}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </PlacesAutocomplete>
                ) : (
                  <label className="block mb-2 relative">
                    {estChampRempli(projetActif.adresse) && (
                      <FaCheckCircle className="absolute top-0 right-0 text-green-500" />
                    )}
                    <input
                      type="text"
                      value={projetActif.adresse || ""}
                      onChange={(e) =>
                        modifierProjet(projetActif.id, {
                          adresse: e.target.value,
                        })
                      }
                      className={`w-full p-3 border rounded mt-1 ${
                        themeSombre
                          ? "bg-gray-700 text-white placeholder-gray-400"
                          : "bg-gray-200 text-gray-900 placeholder-gray-500"
                      }`}
                      placeholder="Entrez l'adresse du projet"
                    />
                  </label>
                )}
                {/* Champ Code Postal */}
                <label className="block mb-2 relative">
                  {estChampRempli(projetActif.codePostal) && (
                    <FaCheckCircle className="absolute top-0 right-0 text-green-500" />
                  )}
                  <input
                    type="text"
                    value={projetActif.codePostal || ""}
                    onChange={(e) =>
                      modifierProjet(projetActif.id, {
                        codePostal: e.target.value,
                      })
                    }
                    className={`w-full p-3 border rounded mt-1 ${
                      themeSombre
                        ? "bg-gray-700 text-white placeholder-gray-400"
                        : "bg-gray-200 text-gray-900 placeholder-gray-500"
                    }`}
                    placeholder="Code postal"
                  />
                </label>
                {/* Champ Ville */}
                <label className="block mb-2 relative">
                  {estChampRempli(projetActif.ville) && (
                    <FaCheckCircle className="absolute top-0 right-0 text-green-500" />
                  )}
                  <input
                    type="text"
                    value={projetActif.ville || ""}
                    onChange={(e) =>
                      modifierProjet(projetActif.id, { ville: e.target.value })
                    }
                    className={`w-full p-3 border rounded mt-1 ${
                      themeSombre
                        ? "bg-gray-700 text-white placeholder-gray-400"
                        : "bg-gray-200 text-gray-900 placeholder-gray-500"
                    }`}
                    placeholder="Ville"
                  />
                </label>
                {/* Responsable Commercial Champ */}
                <label className="block mb-2 relative">
                  {estChampRempli(projetActif.commercial) && (
                    <FaCheckCircle className="absolute top-0 right-0 text-green-500" />
                  )}
                  <select
                    value={projetActif.commercial || ""}
                    onChange={(e) =>
                      modifierProjet(projetActif.id, {
                        commercial: e.target.value,
                      })
                    }
                    className={`w-full p-3 border rounded mt-1 ${
                      themeSombre
                        ? "bg-gray-700 text-white"
                        : "bg-gray-200 text-gray-900"
                    }`}
                  >
                    <option value="">Sélectionner un commercial</option>
                    <option value="MATHIS DELOLMO">MATHIS DELOLMO</option>
                    <option value="ALEXANDRE MARQUES">ALEXANDRE MARQUES</option>
                    <option value="ELIOT DELOLMO">ELIOT DELOLMO</option>
                  </select>
                </label>
                {/* Champs conditionnels après commande */}
                {projetActif.commandeConfirmee && (
                  <>
                    <label className="block mb-2 relative">
                      {estChampRempli(projetActif.devisNumber) && (
                        <FaCheckCircle className="absolute top-0 right-0 text-green-500" />
                      )}
                      <input
                        type="text"
                        value={projetActif.devisNumber || ""}
                        onChange={(e) =>
                          modifierProjet(projetActif.id, {
                            devisNumber: e.target.value,
                          })
                        }
                        className={`w-full p-3 border rounded mt-1 ${
                          themeSombre
                            ? "bg-gray-700 text-white placeholder-gray-400"
                            : "bg-gray-200 text-gray-900 placeholder-gray-500"
                        }`}
                        placeholder="Numéro de devis"
                      />
                    </label>
                    <label className="block mb-2 relative">
                      {estChampRempli(projetActif.clientNumber) && (
                        <FaCheckCircle className="absolute top-0 right-0 text-green-500" />
                      )}
                      <input
                        type="text"
                        value={projetActif.clientNumber || ""}
                        onChange={(e) =>
                          modifierProjet(projetActif.id, {
                            clientNumber: e.target.value,
                          })
                        }
                        className={`w-full p-3 border rounded mt-1 ${
                          themeSombre
                            ? "bg-gray-700 text-white placeholder-gray-400"
                            : "bg-gray-200 text-gray-900 placeholder-gray-500"
                        }`}
                        placeholder="Numéro client"
                      />
                    </label>
                    <label className="block mb-2 relative">
                      {estChampRempli(projetActif.equipmentType) && (
                        <FaCheckCircle className="absolute top-0 right-0 text-green-500" />
                      )}
                      <input
                        type="text"
                        value={projetActif.equipmentType || ""}
                        onChange={(e) =>
                          modifierProjet(projetActif.id, {
                            equipmentType: e.target.value,
                          })
                        }
                        className={`w-full p-3 border rounded mt-1 ${
                          themeSombre
                            ? "bg-gray-700 text-white placeholder-gray-400"
                            : "bg-gray-200 text-gray-900 placeholder-gray-500"
                        }`}
                        placeholder="Type d'équipement"
                      />
                    </label>
                    <label className="block mb-2 relative">
                      {estChampRempli(projetActif.montantHT) && (
                        <FaCheckCircle className="absolute top-0 right-0 text-green-500" />
                      )}
                      <span>Montant de la commande HT</span>
                      <input
                        type="number"
                        value={projetActif.montantHT || 0}
                        onChange={(e) =>
                          modifierProjet(projetActif.id, {
                            montantHT: parseFloat(e.target.value),
                          })
                        }
                        className={`w-full p-3 border rounded mt-1 ${
                          themeSombre
                            ? "bg-gray-700 text-white placeholder-gray-400"
                            : "bg-gray-200 text-gray-900 placeholder-gray-500"
                        }`}
                        placeholder="Montant HT de la commande"
                      />
                    </label>
                  </>
                )}
              </div>
              {/* Notes */}
              <div className="mt-6">
                <h3 className="text-2xl font-bold mb-2 text-yellow-400">
                  Notes
                </h3>
                <textarea
                  onBlur={ajouterNoteAutomatique}
                  placeholder="Ajouter des notes / cotes / dimensions ..."
                  className={`w-full p-3 border rounded mb-2 ${
                    themeSombre
                      ? "bg-gray-700 text-white placeholder-gray-400"
                      : "bg-gray-200 text-gray-900 placeholder-gray-500"
                  }`}
                />
                <ul className="mt-4">
                  {projetActif.notes &&
                    projetActif.notes.map((note) => (
                      <li
                        key={note.id}
                        className={`mb-2 p-3 border rounded ${
                          themeSombre ? "bg-gray-700" : "bg-gray-200"
                        }`}
                      >
                        <p>{note.contenu}</p>
                        <small
                          className={
                            themeSombre ? "text-gray-400" : "text-gray-600"
                          }
                        >
                          {note.date}
                        </small>
                      </li>
                    ))}
                </ul>
              </div>
              {/* Photos */}
              <label className="block mb-2 mt-6">
                Photos du chantier :
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={ajouterPhoto}
                  className={`w-full p-3 border rounded mt-1 ${
                    themeSombre
                      ? "bg-gray-700 text-white"
                      : "bg-gray-200 text-gray-900"
                  }`}
                />
              </label>

              <div className="mt-4 overflow-x-hidden">
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                  {projetActif.photos &&
                    projetActif.photos.map((photo, index) => (
                      <div
                        key={index}
                        className="relative cursor-pointer group"
                        style={{ maxWidth: "80px" }} // Limite la largeur du conteneur
                        onClick={() => ouvrirAnnotation(photo)}
                      >
                        <img
                          src={photo.contenu}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-auto object-cover rounded shadow-lg group-hover:opacity-75 transition-opacity"
                          style={{ maxWidth: "100%", height: "auto" }} // Limite la taille de l'image
                        />
                        <a
                          href={photo.contenu}
                          download={photo.nom}
                          className="absolute top-1 right-1 bg-gray-800 bg-opacity-75 text-white p-1 rounded hover:bg-opacity-100"
                          title="Télécharger la photo"
                        >
                          &#x21E9;
                        </a>
                      </div>
                    ))}
                </div>
              </div>
              {/* Pièces jointes */}
              <label className="block mb-2 mt-6">
                Pièces Jointes / devis / pv de réception :
                <input
                  type="file"
                  multiple
                  onChange={ajouterPieceJointe}
                  className={`w-full p-3 border rounded mt-1 ${
                    themeSombre
                      ? "bg-gray-700 text-white"
                      : "bg-gray-200 text-gray-900"
                  }`}
                />
              </label>
              <ul className="mt-2">
                {projetActif.piecesJointes &&
                  projetActif.piecesJointes.map((fichier, index) => (
                    <li key={index} className="mb-2">
                      <a
                        href={fichier.contenu}
                        download={fichier.nom}
                        className="text-yellow-400 underline hover:text-yellow-600 flex items-center"
                      >
                        <FaEnvelope className="mr-1" /> {fichier.nom}
                      </a>
                    </li>
                  ))}
              </ul>
              {/* Options supplémentaires pour les projets commandés */}
              {/* Options supplémentaires pour les projets commandés */}
              {/* Options supplémentaires pour les projets commandés */}
              {projetActif.commandeConfirmee && (
                <div className="mt-6">
                  <h3 className="text-2xl font-bold mb-2 text-yellow-400">
                    Information chantier et facturation :
                  </h3>
                  <div className="flex flex-col gap-4">
                    {/* 1er acompte */}
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={
                            projetActif.etapes?.acompte1?.checked || false
                          }
                          onChange={(e) =>
                            gererEtapeChantier(
                              "acompte1",
                              "checked",
                              e.target.checked
                            )
                          }
                          className="mr-2"
                        />
                        1er acompte
                      </label>
                      <input
                        type="number"
                        value={projetActif.etapes?.acompte1?.montant || ""}
                        onChange={(e) =>
                          gererEtapeChantier(
                            "acompte1",
                            "montant",
                            e.target.value
                          )
                        }
                        placeholder="Montant"
                        className="p-2 border rounded"
                      />
                      <input
                        type="text"
                        value={
                          projetActif.etapes?.acompte1?.factureNumber || ""
                        }
                        onChange={(e) =>
                          gererEtapeChantier(
                            "acompte1",
                            "factureNumber",
                            e.target.value
                          )
                        }
                        placeholder="Numéro de facture"
                        className="p-2 border rounded"
                      />
                    </div>
                    {/* 2ème acompte */}
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={
                            projetActif.etapes?.acompte2?.checked || false
                          }
                          onChange={(e) =>
                            gererEtapeChantier(
                              "acompte2",
                              "checked",
                              e.target.checked
                            )
                          }
                          className="mr-2"
                        />
                        2ème acompte
                      </label>
                      <input
                        type="number"
                        value={projetActif.etapes?.acompte2?.montant || ""}
                        onChange={(e) =>
                          gererEtapeChantier(
                            "acompte2",
                            "montant",
                            e.target.value
                          )
                        }
                        placeholder="Montant"
                        className="p-2 border rounded"
                      />
                      <input
                        type="text"
                        value={
                          projetActif.etapes?.acompte2?.factureNumber || ""
                        }
                        onChange={(e) =>
                          gererEtapeChantier(
                            "acompte2",
                            "factureNumber",
                            e.target.value
                          )
                        }
                        placeholder="Numéro de facture"
                        className="p-2 border rounded"
                      />
                    </div>
                    {/* Solde */}
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={projetActif.etapes?.solde?.checked || false}
                          onChange={(e) =>
                            gererEtapeChantier(
                              "solde",
                              "checked",
                              e.target.checked
                            )
                          }
                          className="mr-2"
                        />
                        Solde
                      </label>
                      <input
                        type="number"
                        value={projetActif.etapes?.solde?.montant || ""}
                        onChange={(e) =>
                          gererEtapeChantier("solde", "montant", e.target.value)
                        }
                        placeholder="Montant"
                        className="p-2 border rounded"
                      />
                      <input
                        type="text"
                        value={projetActif.etapes?.solde?.factureNumber || ""}
                        onChange={(e) =>
                          gererEtapeChantier(
                            "solde",
                            "factureNumber",
                            e.target.value
                          )
                        }
                        placeholder="Numéro de facture"
                        className="p-2 border rounded"
                      />
                    </div>
                    {/* PV de réception */}
                    <div className="flex items-center gap-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={
                            projetActif.etapes?.pvReceptionValide?.checked ||
                            false
                          }
                          onChange={(e) =>
                            gererEtapeChantier(
                              "pvReceptionValide",
                              "checked",
                              e.target.checked
                            )
                          }
                          className="mr-2"
                        />
                        PV de réception
                      </label>
                    </div>
                  </div>
                  {/* o de client payeur */}
                  <div className="mt-4">
                    <label className="block mb-2">
                      Numéro de client payeur :
                      <input
                        type="text"
                        value={projetActif.clientPayeurNumber || ""}
                        onChange={(e) =>
                          modifierProjet(projetActif.id, {
                            clientPayeurNumber: e.target.value,
                          })
                        }
                        className={`w-full p-3 border rounded mt-1 ${
                          themeSombre
                            ? "bg-gray-700 text-white placeholder-gray-400"
                            : "bg-gray-200 text-gray-900 placeholder-gray-500"
                        }`}
                        placeholder="Entrez le numéro de client payeur"
                      />
                    </label>
                  </div>
                </div>
              )}
              {projetActif.commandeConfirmee && (
                <div className="mt-6">
                  <h3 className="text-2xl font-bold mb-2 text-yellow-400"></h3>
                  <div className="flex flex-col gap-4">
                    {/* 1er acompte */}
                    {/* ... votre code pour les étapes du chantier ... */}
                    {/* Solde */}
                    {/* ... */}
                    {/* PV de réception */}
                    {/* ... */}
                  </div>

                  {/* Section Informations Client Payeur */}
                  <div className="mt-6">
                    <h3 className="text-2xl font-bold mb-2 text-yellow-400">
                      Informations Client Payeur :
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      {/* Nom du client payeur */}
                      <label className="block mb-2">
                        client payeur :
                        <input
                          type="text"
                          value={projetActif.clientPayeurNom || ""}
                          onChange={(e) =>
                            modifierProjet(projetActif.id, {
                              clientPayeurNom: e.target.value,
                            })
                          }
                          className={`w-full p-3 border rounded mt-1 ${
                            themeSombre
                              ? "bg-gray-700 text-white"
                              : "bg-gray-200 text-gray-900"
                          }`}
                        />
                      </label>

                      {/* Adresse du client payeur */}
                      <label className="block mb-2">
                        Adresse payeur :
                        <input
                          type="text"
                          value={projetActif.clientPayeurAdresse || ""}
                          onChange={(e) =>
                            modifierProjet(projetActif.id, {
                              clientPayeurAdresse: e.target.value,
                            })
                          }
                          className={`w-full p-3 border rounded mt-1 ${
                            themeSombre
                              ? "bg-gray-700 text-white"
                              : "bg-gray-200 text-gray-900"
                          }`}
                        />
                      </label>

                      {/* Code postal du client payeur */}
                      <label className="block mb-2">
                        Code postal payeur -:
                        <input
                          type="text"
                          value={projetActif.clientPayeurCodePostal || ""}
                          onChange={(e) =>
                            modifierProjet(projetActif.id, {
                              clientPayeurCodePostal: e.target.value,
                            })
                          }
                          className={`w-full p-3 border rounded mt-1 ${
                            themeSombre
                              ? "bg-gray-700 text-white"
                              : "bg-gray-200 text-gray-900"
                          }`}
                        />
                      </label>

                      {/* Ville du client payeur */}
                      <label className="block mb-2">
                        Ville payeur :
                        <input
                          type="text"
                          value={projetActif.clientPayeurVille || ""}
                          onChange={(e) =>
                            modifierProjet(projetActif.id, {
                              clientPayeurVille: e.target.value,
                            })
                          }
                          className={`w-full p-3 border rounded mt-1 ${
                            themeSombre
                              ? "bg-gray-700 text-white"
                              : "bg-gray-200 text-gray-900"
                          }`}
                        />
                      </label>

                      {/* Numéro de client payeur */}
                      <label className="block mb-2">
                        Numéro du client payeur :
                        <input
                          type="text"
                          value={projetActif.clientPayeurNumber || ""}
                          onChange={(e) =>
                            modifierProjet(projetActif.id, {
                              clientPayeurNumber: e.target.value,
                            })
                          }
                          className={`w-full p-3 border rounded mt-1 ${
                            themeSombre
                              ? "bg-gray-700 text-white"
                              : "bg-gray-200 text-gray-900"
                          }`}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}
              {projetActif.commandeConfirmee && (
                <div className="mt-6">
                  <h3 className="text-2xl font-bold mb-2 text-white-400">
                    Avancement du chantier :
                  </h3>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="10"
                    value={projetActif.avancement}
                    onChange={(e) =>
                      gererAvancement(parseInt(e.target.value, 10))
                    }
                    className="w-full"
                  />
                  <p className="text-lg">{projetActif.avancement}%</p>
                  <h3 className="text-2xl font-bold mt-6 mb-2 text-yellow-400">
                    Date prévisionnelle des travaux :
                  </h3>
                  <DatePicker
                    selected={
                      projetActif.datePrevisionnelle
                        ? new Date(projetActif.datePrevisionnelle)
                        : null
                    }
                    onChange={(date) =>
                      modifierProjet(projetActif.id, {
                        datePrevisionnelle: date,
                      })
                    }
                    className={`w-full p-3 border rounded mt-1 ${
                      themeSombre
                        ? "bg-gray-700 text-white placeholder-gray-400"
                        : "bg-gray-200 text-gray-900 placeholder-gray-500"
                    }`}
                    placeholderText="Sélectionner une date"
                  />
                </div>
              )}
            </div>
            {/* Actions sur le projet */}
            <div className="mt-6 flex flex-wrap gap-4">
              {!projetActif.commandeConfirmee && (
                <button
                  onClick={() => marquerCommeCommande(projetActif)}
                  className="bg-yellow-500 text-black p-3 rounded hover:bg-yellow-400 transition-colors flex items-center"
                >
                  <FaCheck className="mr-1" /> Projet accepté
                </button>
              )}
              <button
                onClick={() => supprimerProjet(projetActif.id)}
                className="bg-red-600 text-white p-3 rounded hover:bg-red-500 transition-colors flex items-center"
              >
                <FaCheckCircle className="mr-1" /> Supprimer
              </button>
              <button
                onClick={() => {
                  setProjetActif(null);
                  setOngletActif(
                    projetActif.commandeConfirmee
                      ? projetActif.etapes &&
                        projetActif.etapes.pvReceptionValide
                        ? "chantiersTermines"
                        : "dossierTravaux"
                      : "listeProjets"
                  );
                }}
                className="bg-gray-600 text-white p-3 rounded hover:bg-gray-500 transition-colors flex items-center"
              >
                <FaUndo className="mr-1" /> Accueil
              </button>
              {/* Bouton Demande de numéro client */}
              <button
                onClick={envoyerEmail}
                className="bg-yellow-500 text-black p-3 rounded hover:bg-yellow-400 transition-colors flex items-center"
              >
                <FaEnvelope className="mr-1" /> Demande automatique du numéro
                client
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Modal pour l'annotation */}
      {annotationImage && (
        <ModalAnnotation
          photo={annotationImage}
          onClose={fermerAnnotation}
          onSave={(annotatedImage, annotations) => {
            const photosMisesAJour = projetActif.photos.map((p) =>
              p.id === annotationImage.id
                ? { ...p, contenu: annotatedImage, annotations }
                : p
            );
            modifierProjet(projetActif.id, { photos: photosMisesAJour });
            setAnnotationImage(null);
            afficherNotification(
              "Annotations enregistrées avec succès",
              "success"
            );
          }}
          themeSombre={themeSombre}
        />
      )}
    </div>
  );
};

export default AppGestionChantiers;
