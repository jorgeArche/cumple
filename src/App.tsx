import { useState, useEffect } from 'react';
import './App.css';
import { db } from './lib/firebase';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';

interface Comment {
  id?: string;
  name: string;
  text: string;
  date: string;
  edited?: boolean;
  isMine?: boolean;
}


function App() {
  const [ showModal, setShowModal ] = useState(false);
  const [ comments, setComments ] = useState<Comment[]>([]);
  const [ commentName, setCommentName ] = useState('');
  const [ commentText, setCommentText ] = useState('');
  const [ commentSaved, setCommentSaved ] = useState(false);
  const [ loading, setLoading ] = useState(false);
  const [ error, setError ] = useState<string | null>(null);
  const [ editingId, setEditingId ] = useState<string | null>(null);
  const [ editName, setEditName ] = useState('');
  const [ editText, setEditText ] = useState('');


  const getSessionId = () => {
    const key = 'cumple_session_id';
    let id = localStorage.getItem(key);
    if (!id) {
      id = (crypto as any).randomUUID
        ? crypto.randomUUID()
        : String(Date.now()) + Math.random().toString(16).slice(2);
      localStorage.setItem(key, id);
    }
    return id;
  };

  useEffect(() => {
    // Escuchar comentarios en tiempo real desde Firebase
    setLoading(true);
    const q = query(collection(db, 'comments'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot: any) => {
      const sessionId = getSessionId();
      const commentsData: Comment[] = [];
      querySnapshot.forEach((doc: any) => {
        const data = doc.data();
        commentsData.push({
          id: doc.id,
          name: data.name,
          text: data.text,
          date: data.date,
          edited: !!data.edited,
          isMine: data.ownerSessionId === sessionId
        });
      });
      setComments(commentsData);
      setLoading(false);
    }, (error: any) => {
      console.error('Error escuchando comentarios:', error);
      setError('Error al cargar comentarios de Firebase');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [])
    ;

  const handleRegistroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowModal(true);
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (commentName.trim() && commentText.trim()) {
      try {
        setLoading(true);
        setError(null);

        const now = new Date();
        const dateStr =
          now.toLocaleDateString('es-ES') + ' ' +
          now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

        await addDoc(collection(db, 'comments'), {
          name: commentName.trim(),
          text: commentText.trim(),
          date: dateStr,
          ownerSessionId: getSessionId(),
          createdAt: serverTimestamp()
        });

        setCommentName('');
        setCommentText('');
        setCommentSaved(true);
        setTimeout(() => setCommentSaved(false), 3000);
      } catch (error) {
        console.error('Error guardando comentario:', error);
        setError('Error al guardar el comentario en Firebase.');
      } finally {
        setLoading(false);
      }
    }
  }
    ;

  const startEdit = (c: Comment) => {
    if (!c.id) return;
    setEditingId(c.id);
    setEditName(c.name);
    setEditText(c.text);
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditText('');
  };

  const saveEdit = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const now = new Date();
      const dateStr =
        now.toLocaleDateString('es-ES') + ' ' +
        now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

      const docRef = doc(db, 'comments', id);
      await updateDoc(docRef, {
        name: editName.trim(),
        text: editText.trim(),
        date: dateStr,
        edited: true
      });

      cancelEdit();
    } catch (e) {
      console.error(e);
      setError('Error al editar el comentario en Firebase.');
    } finally {
      setLoading(false);
    }
  }
    ;

  const deleteComment = async (id: string) => {
    const ok = window.confirm('¿Borrar este comentario?');
    if (!ok) return;

    try {
      setLoading(true);
      setError(null);

      await deleteDoc(doc(db, 'comments', id));

      if (editingId === id) cancelEdit();
    } catch (e) {
      console.error(e);
      setError('Error al borrar el comentario en Firebase.');
    } finally {
      setLoading(false);
    }
  }
    ;

  const escapeHtml = (text: string) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  useEffect(() => {
    // Efecto de título parpadeante
    const interval = setInterval(() => {
      const title = document.querySelector('.main-title') as HTMLElement;
      if (title && Math.random() > 0.9) {
        title.style.textShadow = `
          ${Math.random() * 20}px ${Math.random() * 20}px 0 #ff00ff,
          ${Math.random() * -20}px ${Math.random() * 20}px 0 #00ffff
        `;
        setTimeout(() => {
          title.style.textShadow = '0 0 10px #ff00ff, 0 0 20px #ff00ff, 0 0 40px #ff00ff';
        }, 100);
      }
    }, 200);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Advertencia al salir
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '¿Seguro? Robertosaurio ya te ha visto...';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return (
    <>
      <div className="scanlines"></div>
      <div className="strobe-bg"></div>

      <header>
        <h1 className="main-title">IMPERDIBLE</h1>
        <div className="subtitle-rave">30 Años de caos planificado</div>
        <div className="age-badge">GENERACIÓN '96</div>
        <div className="date-rave">
          21 FEB 11:00 ▶ 22 FEB 8:00<br />
          <span>21 HORAS DE BPMs SOSTENIDOS</span>
        </div>
      </header>

      <div className="warning-rave">
        <div className="warning-text">
          ⚠ ATENCIÓN: ESTA WEB CONTIENE PARPADEO LUMÍNICO, SARCASMO NIVEL DIOS Y SUSTANCIAS VIRTUALES ⚠ NO APTO PARA GENTE QUE DICE "LA RESACA ME MATA" ⚠
        </div>
      </div>

      <section>
        <div className="info-grid">
          <div className="info-card">
            <h3>📅 FECHA</h3>
            <p>
              <span className="highlight">21 FEB - 11:00 AM</span><br />
              Al <span className="highlight">22 FEB - 8:00 AM</span><br /><br />
              <em style={{ color: '#666' }}>Cumple el 19 pero necesitamos 2 días para bajar</em><br /><br />
              <span style={{ color: '#ffff00', textShadow: '0 0 10px #ffff00' }}>NON-STOP TEKNO</span>
            </p>
          </div>

          <div className="info-card">
            <h3>📍 LOCALIZACIÓN</h3>
            <p>
              <span className="highlight">FINCA LA ENCINILLA</span><br />
              Colmenar Viejo, Madrid<br /><br />
              GPS: <span style={{ color: '#00ffff' }}>40.6833°N, 3.7667°W</span><br /><br />
              <em style={{ color: '#ff00ff' }}>Tan aislada que ni la Guardia Civil nos encuentra</em>
            </p>
          </div>

          <div className="info-card">
            <h3>🎒 EQUIPO</h3>
            <p>
              • Ropa que brille en UV y ropa de montaña (o sin ropa)<br />
              • Protectores auditivos<br />
              • Agua (para fingir que nos hidratamos)<br />
              • <span style={{ color: '#ffff00' }}>Speed</span><br />
              • Más speed<br />
              • Calimocho a troche y moche<br />
              • Actitud de "esto no me afecta"
            </p>
          </div>

          <div className="info-card">
            <h3>⚡ REGLAS</h3>
            <p>
              1. <span className="blink" style={{ color: '#ff00ff' }}>NO POLICÍA</span><br />
              2. Lo que pasa en La Encinilla...<br />
              3. Si caes, te grabamos<br />
              4. El que aguante más gana<br />
              5. <span style={{ color: '#ffff00' }}>Robertosaurio manda</span>
            </p>
          </div>
        </div>
      </section>

      <div className="warning-rave">
        <div className="warning-text" style={{ animationDirection: 'reverse' }}>
          ★ INVITADO ESPECIAL ★ LEYENDA VIVA ★ MÁS VIEJO QUE LA TOS ★
        </div>
      </div>

      <section className="roberto-section">
        <h2 className="roberto-title">★ HEADLINERS EXCLUSIVOS ★</h2>
        <div className="roberto-name">ROBERTOSAURIO</div>
        <div className="roberto-desc">
          El ajedrecista más caótico de la escena rave.<br />
          <span style={{ color: '#ff00ff' }}>Compitió con Kasparov en sus tiempos mozos.</span><br /><br />
          Maestro del gambito de rey borracho.<br />
          Cuenta la leyenda que ganó a Deep Blue con una mano<br />
          mientras se hacía una raya con la otra.<br />
          Su ELO real supera los 3000... en el speed.<br /><br />
          <span style={{ color: '#ffff00', fontSize: '1.3rem' }}>PARTIDA SIMULTÁNEA: "JAQUE MATE AL HÍGADO"</span>
        </div>
        <div className="roberto-legend">
          "He visto caer a los mejores, pero yo sigo aquí, pintando rayas y contando historias que nadie pidió"
        </div>
      </section>

      <section className="roberto-section" style={{ background: 'linear-gradient(180deg, #000 0%, #33001a 50%, #000 100%)', borderTop: '5px solid #00ffff', borderBottom: '5px solid #ff00ff' }}>
        <div className="roberto-name" style={{ color: '#00ffff', textShadow: '0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 40px #00ffff' }}>PEPE GOTERA Y OTILIO</div>
        <div className="roberto-desc">
          Los reyes del punktekno casero y las letras que tu madre no quiere que escuches.<br />
          <span style={{ color: '#ff00ff' }}>Leyendas urbanas de la escena underground madrileña.</span><br /><br />
          Sus éxitos han resonado en garajes, sótanos y fiestas donde la policía nunca llegó.<br />
          Maestros de la rima gamberra y el ritmo que te parte el corazón (y el hígado).<br /><br />
          <span style={{ color: '#ffff00', fontSize: '1.3rem' }}>SETLIST CONFIRMADO:</span><br />
          <span style={{ color: '#00ffff', fontSize: '1.1rem' }}>• "Drogoadicción"</span><br />
          <span style={{ color: '#00ffff', fontSize: '1.1rem' }}>• "La vida es dura pero más dura es la polla del cura no sabe a verdura si no a trauma que perdura"</span><br />
          <span style={{ color: '#00ffff', fontSize: '1.1rem' }}>• "Papapapapap apapapapapa"</span>
        </div>
        <div className="roberto-legend" style={{ borderColor: '#00ffff', color: '#ff00ff' }}>
          "Si no conoces sus temas, no has vivido. Si los conoces, probablemente tampoco."
        </div>
      </section>

      <section className="roberto-section" style={{ background: 'linear-gradient(180deg, #000 0%, #1a3300 50%, #000 100%)', borderTop: '5px solid #ff00ff', borderBottom: '5px solid #ffff00' }}>
        <div className="roberto-name" style={{ color: '#ff00ff', textShadow: '0 0 10px #ff00ff, 0 0 20px #ff00ff, 0 0 40px #ff00ff', animation: 'shake 0.5s infinite' }}>LAS CHICAS FRESH</div>
        <div className="roberto-desc">
          Locas como cabras, gamberras como nadie. Su fiesta es suya y de nadie más.<br />
          <span style={{ color: '#ffff00' }}>Con más carácter que la Maggie. ¡Cuidado que muerden!</span><br /><br />
          Muy borrachas pero nada de buenas muchachas.<br />
          Speedicas perdidas todo el día, las reinas del caos controlado (o descontrolado, según se mire).<br />
          Si las ves venir, mejor aparta. Si te acercas, prepárate para lo peor... o lo mejor.<br /><br />
          <span style={{ color: '#ff00ff', fontSize: '1.3rem' }}>ESTADO CONFIRMADO: PERDIDAS PERO FUNCIONALES</span>
        </div>
        <div className="roberto-legend" style={{ borderColor: '#ff00ff', color: '#ffff00', transform: 'rotate(2deg)' }}>
          "No necesitan salvador, necesitan más speed y menos juicio. Peligrosas, adictas y orgullosas de serlo."
        </div>
      </section>

      <section className="roberto-section" style={{ background: 'linear-gradient(180deg, #000 0%, #00331a 50%, #000 100%)', borderTop: '5px solid #ffff00', borderBottom: '5px solid #00ffff' }}>
        <h2 className="roberto-title" style={{ color: '#ffff00' }}>★ Y MUCHOS MÁS GRANDES ARTISTAS ★</h2>

        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'left' }}>
          <div style={{ marginBottom: '2rem' }}>
            <div className="roberto-name" style={{ fontSize: 'clamp(1.5rem, 6vw, 2.5rem)', color: '#00ffff', textShadow: '0 0 10px #00ffff, 0 0 20px #00ffff', marginBottom: '0.5rem' }}>TEATRO CREW</div>
            <div className="roberto-desc" style={{ textAlign: 'left', fontSize: 'clamp(0.95rem, 3.5vw, 1.2rem)' }}>
              Se venden como grupo de teatro, pero son una secta con focos: te atrapan, te suben y te arrastran. Sales aplaudiendo sin saber por qué, con sed criminal y una cerveza en la mano como si fuera parte del trato.
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <div className="roberto-name" style={{ fontSize: 'clamp(1.5rem, 6vw, 2.5rem)', color: '#ff00ff', textShadow: '0 0 10px #ff00ff, 0 0 20px #ff00ff', marginBottom: '0.5rem' }}>LA GENTUZA DE COBEÑA Y ALREDEDORES</div>
            <div className="roberto-desc" style={{ textAlign: 'left', fontSize: 'clamp(0.95rem, 3.5vw, 1.2rem)' }}>
              Los vecinos que nunca quisiste tener pero que siempre necesitas en una fiesta. Expertos en convertir cualquier lugar en el mejor sitio del mundo (o el peor, según se mire).
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <div className="roberto-name" style={{ fontSize: 'clamp(1.5rem, 6vw, 2.5rem)', color: '#ffff00', textShadow: '0 0 10px #ffff00, 0 0 20px #ffff00', marginBottom: '0.5rem' }}>Y MUCHOS MÁS</div>
          </div>
        </div>

        <div style={{ marginTop: '2rem', fontSize: 'clamp(0.8rem, 2.5vw, 1rem)', color: '#888', fontStyle: 'italic' }}>
          (también viene Iñaki....)
        </div>
      </section>

      <section className="activities">
        <h2>► LINE-UP DE ACTIVIDADES ◄</h2>
        <ul className="activity-list">
          <li>
            <span className="activity-title">CARRERAS DE CERVEZA (150 BPM)</span>
            500 metros con six-pack en cada mano. Categoría: "Todavía puedo". El que derrame menos es un pringao. El que derrame más es un héroe.
          </li>

          <li>
            <span className="activity-title">PINTAR RAYAS OLÍMPICO</span>
            Competición de precisión milimétrica. Jueces internacionales (nos los inventamos). Material: speed. El que pinta más recto gana, el que pinta torcido también.
          </li>

          <li>
            <span className="activity-title">JUEGOS DE MESA HARD</span>
            Risk versión "conquista del hígado". Monopoly con dinero real (o lo que quede). Poker con apuestas de dignidad. Ajedrez para los que el speed les da concentración.
          </li>

          <li>
            <span className="activity-title">CALIMOCHO A TROCHE Y MOCHE</span>
            Producción artesanal y consumo masivo. Botellas de dos litros, bag in box, y lo que caiga. Mezcla 50/50 o como salga.
          </li>

          <li>
            <span className="activity-title">TEKNO EN EL BOSQUE</span>
            3 AM. Altavoces robados. Ritmos de 180 BPM. Animales huyendo. Tú perdiendo la noción de la realidad.
          </li>

          <li>
            <span className="activity-title">TERAPIA DE GRUPO (5 AM)</span>
            Círculo de confesiones: "¿Por qué seguimos haciendo esto a los 30?". Respuesta: Porque tenemos speed. Lloros y abrazos sudorosos.
          </li>

          <li>
            <span className="activity-title">DESAYUNO A LAS 6 AM</span>
            Lo que encuentres tirado por ahí. Café recalentado hasta la muerte, dignidad por los suelos, y la certeza absoluta de que el lunes llamarás al trabajo diciendo que estás enfermo. <span style={{ color: '#ffff00' }}>Premio al último superviviente que siga en pie.</span>
          </li>
        </ul>
      </section>

      <section className="pasaos-section">
        <h2 className="pasaos-title">► GUARDERÍA DE PASAOS ◄</h2>
        <div className="pasaos-desc">
          Zona exclusiva para los que ya no pueden más pero no quieren irse.<br />
          Un espacio de paz (relativa) donde recuperar el alma mientras el cuerpo sigue en la pista.<br />
          <span style={{ color: '#ffff00' }}>Servicio de guardería gratuito incluido.</span>
        </div>

        <div className="pasaos-grid">
          <div className="pasao-card">
            <h4>♟ AJEDREZ</h4>
            <p>Para los que el speed les da concentración en vez de paranoia. Partidas épicas mientras el mundo explota fuera.</p>
          </div>

          <div className="pasao-card">
            <h4>🛋 ZONA CHILL</h4>
            <p>Sofás viejos, mantas sucias, y alguien siempre durmiendo sentado. El paraíso del pasao.</p>
          </div>

          <div className="pasao-card">
            <h4>🍵 INFUSIONES</h4>
            <p>Infusiones que nadie pidió pero todos necesitan. Calma la ansiedad del speed con tila o valeriana calentada en microondas.</p>
          </div>
        </div>
      </section>

      <section className="location">
        <h2>► COORDENADAS ◄</h2>
        <div className="location-name">LA ENCINILLA</div>
        <div className="location-sub">Colmenar Viejo - Zona de Exclusión Aérea</div>

        <p style={{ fontSize: 'clamp(0.95rem, 3.5vw, 1.3rem)', maxWidth: '700px', margin: '0 auto', color: '#ccc', padding: '0 0.5rem' }}>
          Finca aislada con piscina (para cosas no aptas para Instagram),
          barbacoa (para quemar evidencias), y espacio para perder amistades.
        </p>

        <div className="map-box">
          <div style={{ fontSize: 'clamp(3rem, 10vw, 5rem)', marginBottom: '1rem' }}>📍</div>
          <div className="coords-big">
            40°40'59.9"N<br />
            3°46'00.0"W
          </div>
          <p style={{ marginTop: '1.5rem', color: '#ff00ff', fontFamily: "'Permanent Marker', cursive", fontSize: 'clamp(0.9rem, 3.5vw, 1.2rem)' }}>
            "Si llegas, sobrevives. Si no, no eras digno."
          </p>
        </div>
      </section>

      <section className="transport-section">
        <h2 className="transport-title">► TRANSPORTE OFICIAL ◄</h2>

        <div className="transport-grid">
          <div className="transport-item">
            <div className="transport-icon">🚗</div>
            <strong>COCHE</strong><br />
            GPS dice 40 min, realidad 1h30
          </div>

          <div className="transport-item">
            <div className="transport-icon">🚕</div>
            <strong>UBER</strong><br />
            Dile que es "una barbacoa"
          </div>

          <div className="transport-item">
            <div className="transport-icon">🚌</div>
            <strong>BUS</strong><br />
            Existe, pero no llegas vivo
          </div>

          <div className="transport-item">
            <div className="transport-icon">🚑</div>
            <strong style={{ color: '#ff0040' }}>AMBULANCIA</strong><br />
            La más probable. Incluida.
          </div>
        </div>

        <div className="ambulance-quote">
          "CON ESTILO Y ELEGANCIA<br />
          ESTA NOCHE SE VUELVE EN AMBULANCIA"
        </div>
      </section>

      <section className="form-section">
        <div className="form-container">
          <h2 className="form-title">► REGISTRO OFICIAL ◄</h2>
          <p style={{ color: '#ccc', marginBottom: '1.5rem', fontSize: 'clamp(0.9rem, 3.5vw, 1.2rem)' }}>
            Rellena tus datos para entrar en la lista (no sirve para nada)
          </p>

          <form onSubmit={handleRegistroSubmit}>
            <div className="form-group">
              <label htmlFor="nombre">NOMBRE</label>
              <input type="text" id="nombre" name="nombre" required />
            </div>

            <div className="form-group">
              <label htmlFor="apellidos">APELLIDOS</label>
              <input type="text" id="apellidos" name="apellidos" required />
            </div>

            <div className="form-group">
              <label htmlFor="dni">DNI (PARA LA FICHA)</label>
              <input type="text" id="dni" name="dni" required />
            </div>

            <div className="form-group">
              <label htmlFor="telefono">TELÉFONO DE TU MADRE</label>
              <input type="tel" id="telefono" name="telefono" required />
            </div>

            <div className="form-group">
              <label htmlFor="sustancia">SUSTANCIA FAVORITA</label>
              <input type="text" id="sustancia" name="sustancia" placeholder="Speed, obviamente" required />
            </div>

            <button type="submit" className="submit-btn">ENVIAR →</button>
          </form>
        </div>
      </section>

      <section className="comments-section">
        <div className="comments-container">
          <h2 className="form-title">► DEDICATORIAS DE CUMPLEAÑOS ◄</h2>
          <p style={{ color: '#ccc', marginBottom: '1.5rem', fontSize: 'clamp(0.9rem, 3.5vw, 1.2rem)' }}>
            Deja tu mensajito para el cumpleañero. Anonimato opcional (pero no recomendado).
          </p>

          <form onSubmit={handleCommentSubmit}>
            <div className="form-group">
              <label htmlFor="commentName">TU NOMBRE (O ALIAS)</label>
              <input
                type="text"
                id="commentName"
                name="commentName"
                placeholder="El Fiera, El Pringao, etc."
                value={commentName}
                onChange={(e) => setCommentName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="commentText">DEDICATORIA</label>
              <textarea
                id="commentText"
                name="commentText"
                rows={3}
                placeholder="Felices 30, cabrón..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'PUBLICANDO...' : 'PUBLICAR MENSAJE →'}
            </button>
          </form>

          {error && (
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              background: 'rgba(255,0,0,0.2)',
              border: '2px solid #ff0040',
              color: '#ff0040',
              textAlign: 'center',
              fontSize: 'clamp(0.9rem, 3vw, 1.1rem)'
            }}>
              {error}
            </div>
          )}

          {commentSaved && (
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              background: 'rgba(0,255,0,0.2)',
              border: '2px solid #00ff00',
              color: '#00ff00',
              textAlign: 'center',
              fontSize: 'clamp(0.9rem, 3vw, 1.1rem)'
            }}>
              ¡Dedicatoria publicada! 🎉
            </div>
          )}

          <div className="comments-list">
            {loading && comments.length === 0 ? (
              <div className="no-comments">Cargando dedicatorias...</div>
            ) : comments.length === 0 ? (
              <div className="no-comments">Aún no hay dedicatorias. Sé el primero, valiente.</div>
            ) : (
              comments.map((comment) => {
                const id = comment.id;
                const isEditing = id && editingId === id;

                return (
                  <div key={id || comment.date} className="comment-item">
                    {isEditing ? (
                      <>
                        <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                          <label>EDITAR NOMBRE</label>
                          <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                          />
                        </div>

                        <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                          <label>EDITAR MENSAJE</label>
                          <textarea
                            rows={3}
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                          />
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                          <button
                            type="button"
                            className="submit-btn"
                            disabled={loading || !id}
                            onClick={() => id && saveEdit(id)}
                            style={{ padding: '0.6rem 1rem' }}
                          >
                            {loading ? 'GUARDANDO...' : 'GUARDAR'}
                          </button>

                          <button
                            type="button"
                            className="submit-btn"
                            onClick={cancelEdit}
                            style={{ padding: '0.6rem 1rem', opacity: 0.8 }}
                          >
                            CANCELAR
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="comment-author">
                          {escapeHtml(comment.name)} {comment.edited ? <span style={{ color: '#888' }}>(editado)</span> : null}
                        </div>
                        <div className="comment-text">{escapeHtml(comment.text)}</div>
                        <div className="comment-date">{comment.date}</div>

                        {comment.isMine && id && (
                          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                            <button
                              type="button"
                              className="submit-btn"
                              style={{ padding: '0.55rem 1rem' }}
                              onClick={() => startEdit(comment)}
                            >
                              EDITAR
                            </button>

                            <button
                              type="button"
                              className="submit-btn"
                              style={{ padding: '0.55rem 1rem', opacity: 0.85 }}
                              onClick={() => deleteComment(id)}
                            >
                              BORRAR
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {showModal && (
        <div className="modal" style={{ display: 'flex' }}>
          <div className="modal-content">
            <div className="modal-text">
              ¿DE VERDAD CREÍAS QUE ERA NECESARIO REGISTRARSE, PEDAZO DE PRINGUI?
            </div>
            <p style={{ color: '#888', fontSize: 'clamp(0.9rem, 3.5vw, 1.2rem)', marginBottom: '1.5rem' }}>
              Eres tonto, chaval. Solo ven y punto.
            </p>
            <button className="modal-btn" onClick={() => setShowModal(false)}>VALE, LO SIENTO</button>
          </div>
        </div>
      )}

      <div className="warning-rave">
        <div className="warning-text">
          ★ SI HAS LEÍDO HASTA AQUÍ YA ESTÁS COMPROMETIDO ★ NO HAY VUELTA ATRÁS ★ ROBERTOSAURIO YA SABE TU NOMBRE ★
        </div>
      </div>

      <div className="disclaimer">
        <h3>⚠ CLÁUSULA DE LIBERACIÓN DE RESPONSABILIDAD⚠</h3>
        <p>
          Al asistir aceptas que:<br /><br />
          • Tu hígado firmó su sentencia<br />
          • Tu nariz sufrirá daños estéticos<br />
          • Las fotos serán usadas para chantaje<br />
          • Robertosaurio te contará su vida<br />
          • Lo que se pinta, se pinta<br />
          • No existe "mañana"<br />
          • <strong style={{ color: '#ffff00' }}>LLAMADAS A EXS </strong><br />
          • <strong style={{ color: '#ff00ff' }}>LLAMADAS A LAS MADRES</strong><br /><br />

          <span className="red-text">
            IMPERDIBLE NO SE HACE RESPONSABLE DE:<br />
            Crisis de los 30, adicciones nuevas, amistades rotas,<br />
            llamadas a exs a las 4 AM, llamadas a tu madre llorando a las 6 AM.
            Ya somos mayorcitos colegui.
          </span>
        </p>
      </div>

      <footer>
        <div className="footer-text">IMPERDIBLE - 30 AÑOS</div>
        <div className="footer-sub">21-22 FEBRERO 2025 | LA ENCINILLA</div>
        <div className="footer-quote">
          "A los 20 se hace por diversión, a los 30 por costumbre,<br />
          a los 40 porque no sabemos hacer otra cosa"<br />
          <span style={{ color: '#ff00ff' }}>- Yoryo</span>
        </div>
      </footer>
    </>
  );
}

export default App;
