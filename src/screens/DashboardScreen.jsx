import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Modal,
  FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { procesarLecturaTarot } from '../services/geminiService';

const MAZO_TAROT = [
  'El Loco', 'El Mago', 'La Sacerdotisa', 'La Emperatriz', 'El Emperador',
  'El Sumo Sacerdote', 'Los Enamorados', 'El Carro', 'La Fuerza', 'El Ermitaño',
  'La Rueda de la Fortuna', 'La Justicia', 'El Colgado', 'La Muerte', 'La Templanza',
  'El Diablo', 'La Torre', 'La Estrella', 'La Luna', 'El Sol', 'El Juicio', 'El Mundo',
  'As de Copas', '2 de Copas', '3 de Copas', '4 de Copas', '5 de Copas', '6 de Copas', '7 de Copas', '8 de Copas', '9 de Copas', '10 de Copas', 'Sota de Copas', 'Caballero de Copas', 'Reina de Copas', 'Rey de Copas',
  'As de Oros', '2 de Oros', '3 de Oros', '4 de Oros', '5 de Oros', '6 de Oros', '7 de Oros', '8 de Oros', '9 de Oros', '10 de Oros', 'Sota de Oros', 'Caballero de Oros', 'Reina de Oros', 'Rey de Oros',
  'As de Espadas', '2 de Espadas', '3 de Espadas', '4 de Espadas', '5 de Espadas', '6 de Espadas', '7 de Espadas', '8 de Espadas', '9 de Espadas', '10 de Espadas', 'Sota de Espadas', 'Caballero de Espadas', 'Reina de Espadas', 'Rey de Espadas',
  'As de Bastos', '2 de Bastos', '3 de Bastos', '4 de Bastos', '5 de Bastos', '6 de Bastos', '7 de Bastos', '8 de Bastos', '9 de Bastos', '10 de Bastos', 'Sota de Bastos', 'Caballero de Bastos', 'Reina de Bastos', 'Rey de Bastos',
];

const PALETAS = {
  mistico: {
    nombre: '🌌 Místico Noche',
    bg: '#0F172A',
    cardBg: '#1E293B',
    cardBorder: '#334155',
    accent: '#D97706',
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
  },
  amatista: {
    nombre: '🔮 Amatista Real',
    bg: '#12091F',
    cardBg: '#1F1133',
    cardBorder: '#3B2161',
    accent: '#C084FC',
    textPrimary: '#FAF5FF',
    textSecondary: '#A855F7',
  },
  esmalte: {
    nombre: '🌑 Esmalte Oscuro',
    bg: '#18181B',
    cardBg: '#27272A',
    cardBorder: '#3F3F46',
    accent: '#10B981',
    textPrimary: '#FAFAFA',
    textSecondary: '#A1A1AA',
  },
};

export default function DashboardScreen() {
  const [temaActual, setTemaActual] = useState('mistico');
  const colors = PALETAS[temaActual];

  const [loadingModulo, setLoadingModulo] = useState(null);
  const [preguntaTexto, setPreguntaTexto] = useState('');

  const [cartas, setCartas] = useState({
    sensacion: ['', '', ''],
    gratitud: ['', '', ''],
    amor: ['', ''],
    dinero: ['', ''],
    salud: ['', ''],
    terapeutica: ['', '', ''],
  });

  const [resultados, setResultados] = useState({
    sensacion: null,
    gratitud: null,
    triptico: null,
    terapeutica: null,
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [slotActivo, setSlotActivo] = useState(null);
  const [esInvertida, setEsInvertida] = useState(false);

  const [modoHistorico, setModoHistorico] = useState(false);
  const [historialGuardado, setHistorialGuardado] = useState([]);
  const [fechaFiltro, setFechaFiltro] = useState(null);

  useEffect(() => {
    cargarHistorial();
  }, []);

  const cargarHistorial = async () => {
    try {
      const datos = await AsyncStorage.getItem('@lecturas_tarot');
      if (datos) setHistorialGuardado(JSON.parse(datos));
    } catch (e) {
      console.error(e);
    }
  };

  const guardarLectura = async (nuevoResultado) => {
    try {
      const nuevoItem = {
        id: Date.now().toString(),
        fecha: new Date().toISOString().split('T')[0],
        hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        ...nuevoResultado,
      };
      const actualizado = [nuevoItem, ...historialGuardado];
      setHistorialGuardado(actualizado);
      await AsyncStorage.setItem('@lecturas_tarot', JSON.stringify(actualizado));
    } catch (e) {
      console.error(e);
    }
  };

  const eliminarLectura = async (id) => {
    try {
      const filtrados = historialGuardado.filter((item) => item.id !== id);
      setHistorialGuardado(filtrados);
      await AsyncStorage.setItem('@lecturas_tarot', JSON.stringify(filtrados));
    } catch (e) {
      console.error(e);
    }
  };

  const abrirSelectorSlot = (modulo, index) => {
    setSlotActivo({ modulo, index });
    setModalVisible(true);
  };

  const seleccionarCarta = (nombreCarta) => {
    if (!slotActivo) return;
    const nombreFinal = esInvertida ? `${nombreCarta} Inv.` : nombreCarta;
    
    setCartas((prev) => {
      const nuevas = [...prev[slotActivo.modulo]];
      nuevas[slotActivo.index] = nombreFinal;
      return { ...prev, [slotActivo.modulo]: nuevas };
    });

    setModalVisible(false);
    setSlotActivo(null);
    setEsInvertida(false);
  };

  const procesarModulo = async (tipoModulo) => {
    setLoadingModulo(tipoModulo);
    try {
      let payload = { tipo: tipoModulo };
      if (tipoModulo === 'sensacion') payload.cartas = cartas.sensacion.filter(Boolean);
      if (tipoModulo === 'gratitud') payload.cartas = cartas.gratitud.filter(Boolean);
      if (tipoModulo === 'triptico') payload.cartas = { amor: cartas.amor, dinero: cartas.dinero, salud: cartas.salud };
      if (tipoModulo === 'terapeutica') payload = { pregunta: preguntaTexto, cartas: cartas.terapeutica.filter(Boolean), tipo: 'terapeutica' };

      const res = await procesarLecturaTarot(payload);
      
      setResultados((prev) => ({ ...prev, [tipoModulo]: res }));
      await guardarLectura({ modulo: tipoModulo, data: res, cartasUsadas: payload.cartas });
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingModulo(null);
    }
  };

  const obtenerDiasMes = () => {
    const dias = [];
    const hoy = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(hoy.getDate() - i);
      dias.push(d.toISOString().split('T')[0]);
    }
    return dias;
  };

  const lecturasFiltradas = fechaFiltro
    ? historialGuardado.filter((item) => item.fecha === fechaFiltro)
    : historialGuardado;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.headerSub, { color: colors.accent }]}>TAROT & PHRONESIS</Text>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>22 de Septiembre, 2026</Text>
          </View>

          <View style={styles.headerBtns}>
            <TouchableOpacity
              style={[styles.btnTema, { borderColor: colors.cardBorder, backgroundColor: colors.cardBg }]}
              onPress={() => {
                const keys = Object.keys(PALETAS);
                const nextIndex = (keys.indexOf(temaActual) + 1) % keys.length;
                setTemaActual(keys[nextIndex]);
              }}
            >
              <Text style={{ fontSize: 11, color: colors.textPrimary, fontWeight: 'bold' }}>🎨 Tema</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.btnHistory, { borderColor: colors.cardBorder, backgroundColor: colors.cardBg }]} 
              onPress={() => setModoHistorico(!modoHistorico)}
            >
              <Text style={[styles.btnHistoryText, { color: colors.accent }]}>
                {modoHistorico ? '✏️ Panel' : '📅 Histórico'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {!modoHistorico ? (
          <>
            {/* PANEL 1: SENSACIÓN DIARIA */}
            <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>🧠 Sensación Diaria</Text>
              <Text style={[styles.labelInput, { color: colors.textSecondary }]}>Selecciona 3 cartas para deducir tus sensaciones A, B y C del día:</Text>
              <ModuloSlots cartas={cartas.sensacion} colors={colors} onSelectSlot={(idx) => abrirSelectorSlot('sensacion', idx)} />
              <TouchableOpacity style={[styles.btnModulo, { backgroundColor: colors.accent }]} onPress={() => procesarModulo('sensacion')} disabled={loadingModulo === 'sensacion'}>
                {loadingModulo === 'sensacion' ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnModuloText}>Procesar Sensación Diaria</Text>}
              </TouchableOpacity>
              {resultados.sensacion && (
                <TarjetaResultadoCard titulo="Compendio de Sensaciones" contenido={resultados.sensacion?.resumen} colors={colors} />
              )}
            </View>

            {/* PANEL 2: MOTIVOS DE GRATITUD */}
            <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>🌱 Motivos de Gratitud</Text>
              <Text style={[styles.labelInput, { color: colors.textSecondary }]}>Selecciona 3 cartas para deducir tus motivos de gratitud A, B y C:</Text>
              <ModuloSlots cartas={cartas.gratitud} colors={colors} onSelectSlot={(idx) => abrirSelectorSlot('gratitud', idx)} />
              <TouchableOpacity style={[styles.btnModulo, { backgroundColor: colors.accent }]} onPress={() => procesarModulo('gratitud')} disabled={loadingModulo === 'gratitud'}>
                {loadingModulo === 'gratitud' ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnModuloText}>Procesar Gratitud</Text>}
              </TouchableOpacity>
              {resultados.gratitud && (
                <TarjetaResultadoCard titulo="Compendio de Gratitud" contenido={resultados.gratitud?.resumen} colors={colors} />
              )}
            </View>

            {/* PANEL 3: TRÍPTICO DE CONSEJOS */}
            <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>⚔️ Tríptico de Consejos</Text>
              <View style={styles.tripticoGrid}>
                <SubModuloTarjeta titulo="Amor" cartas={cartas.amor} colors={colors} onSelectSlot={(idx) => abrirSelectorSlot('amor', idx)} />
                <SubModuloTarjeta titulo="Dinero" cartas={cartas.dinero} colors={colors} onSelectSlot={(idx) => abrirSelectorSlot('dinero', idx)} />
                <SubModuloTarjeta titulo="Salud" cartas={cartas.salud} colors={colors} onSelectSlot={(idx) => abrirSelectorSlot('salud', idx)} />
              </View>
              <TouchableOpacity style={[styles.btnModulo, { backgroundColor: colors.accent }]} onPress={() => procesarModulo('triptico')} disabled={loadingModulo === 'triptico'}>
                {loadingModulo === 'triptico' ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnModuloText}>Procesar Tríptico</Text>}
              </TouchableOpacity>
              
              {resultados.triptico && (
                <View style={styles.tripticoResContainer}>
                  <TarjetaResultadoMini titulo="❤️ Amor" texto={resultados.triptico?.amor} colors={colors} />
                  <TarjetaResultadoMini titulo="💼 Dinero" texto={resultados.triptico?.dinero} colors={colors} />
                  <TarjetaResultadoMini titulo="🌿 Salud" texto={resultados.triptico?.salud} colors={colors} />
                </View>
              )}
            </View>

            {/* PANEL 4: PREGUNTA TERAPÉUTICA */}
            <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>🔮 Pregunta Terapéutica</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.bg, color: colors.textPrimary, borderColor: colors.cardBorder }]}
                placeholder="Escribe tu inquietud (Ej: ¿Tengo un amor secreto?)"
                placeholderTextColor={colors.textSecondary}
                value={preguntaTexto}
                onChangeText={setPreguntaTexto}
                multiline
              />
              <Text style={[styles.labelInput, { color: colors.textSecondary }]}>Selecciona 3 cartas para la auditoría:</Text>
              <ModuloSlots cartas={cartas.terapeutica} colors={colors} onSelectSlot={(idx) => abrirSelectorSlot('terapeutica', idx)} />
              <TouchableOpacity style={[styles.btnModulo, { backgroundColor: colors.accent }]} onPress={() => procesarModulo('terapeutica')} disabled={loadingModulo === 'terapeutica'}>
                {loadingModulo === 'terapeutica' ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnModuloText}>Procesar Pregunta Terapéutica</Text>}
              </TouchableOpacity>
              
              {resultados.terapeutica && (
                <TarjetaResultadoCard
                  titulo="Respuesta & Veredicto IA"
                  contenido={
                    typeof resultados.terapeutica === 'string'
                      ? resultados.terapeutica
                      : resultados.terapeutica.pregunta_reflexion || resultados.terapeutica.resumen || JSON.stringify(resultados.terapeutica)
                  }
                  colors={colors}
                />
              )}
            </View>
          </>
        ) : (
          /* HISTÓRICO CON CALENDARIO */
          <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>📅 Calendario de Lecturas</Text>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.calendarStrip}>
              <TouchableOpacity
                style={[
                  styles.calendarDay,
                  { borderColor: colors.cardBorder, backgroundColor: fechaFiltro === null ? colors.accent : colors.bg },
                ]}
                onPress={() => setFechaFiltro(null)}
              >
                <Text style={{ color: fechaFiltro === null ? '#FFF' : colors.textPrimary, fontSize: 10, fontWeight: 'bold' }}>
                  TODOS
                </Text>
              </TouchableOpacity>
              {obtenerDiasMes().map((fechaStr) => {
                const diaNum = fechaStr.split('-')[2];
                const esSel = fechaFiltro === fechaStr;
                return (
                  <TouchableOpacity
                    key={fechaStr}
                    style={[
                      styles.calendarDay,
                      { borderColor: colors.cardBorder, backgroundColor: esSel ? colors.accent : colors.bg },
                    ]}
                    onPress={() => setFechaFiltro(esSel ? null : fechaStr)}
                  >
                    <Text style={{ color: esSel ? '#FFF' : colors.textSecondary, fontSize: 9 }}>SEP</Text>
                    <Text style={{ color: esSel ? '#FFF' : colors.textPrimary, fontSize: 13, fontWeight: 'bold' }}>{diaNum}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={[styles.sectionSubtitle, { color: colors.accent }]}>
              {fechaFiltro ? `Lecturas del ${fechaFiltro}` : 'Mostrando todas las lecturas'}
            </Text>

            {lecturasFiltradas.length === 0 ? (
              <Text style={[styles.resText, { color: colors.textSecondary, textAlign: 'center', marginVertical: 20 }]}>
                No hay registros para esta fecha.
              </Text>
            ) : (
              lecturasFiltradas.map((item) => (
                <View key={item.id} style={[styles.historicoCard, { borderColor: colors.cardBorder, backgroundColor: colors.bg }]}>
                  <View style={styles.historicoHeader}>
                    <Text style={[styles.historicoTag, { color: colors.accent }]}>
                      {item.modulo?.toUpperCase()} • {item.hora}
                    </Text>
                    <TouchableOpacity onPress={() => eliminarLectura(item.id)} style={styles.btnTrash}>
                      <Text style={{ fontSize: 11, color: '#EF4444' }}>🗑️ Eliminar</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.resText, { color: colors.textPrimary, marginTop: 6 }]}>
                    {item.data?.resumen || item.data?.pregunta_reflexion || JSON.stringify(item.data)}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}

      </ScrollView>

      {/* MODAL CARTA */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBg }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Selecciona una Carta</Text>
            <TouchableOpacity style={[styles.toggleInv, { borderColor: colors.cardBorder, backgroundColor: colors.bg }, esInvertida && { borderColor: colors.accent }]} onPress={() => setEsInvertida(!esInvertida)}>
              <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: 12 }}>{esInvertida ? '🔄 INVERTIDA' : '⬆️ DERECHA'}</Text>
            </TouchableOpacity>
            <FlatList
              data={MAZO_TAROT}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity style={[styles.itemCarta, { borderBottomColor: colors.cardBorder }]} onPress={() => seleccionarCarta(item)}>
                  <Text style={{ color: colors.textPrimary, fontSize: 14 }}>{item} {esInvertida ? '(Inv.)' : ''}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={[styles.btnCerrarModal, { backgroundColor: colors.bg }]} onPress={() => setModalVisible(false)}>
              <Text style={{ color: colors.accent, fontWeight: 'bold' }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

function TarjetaResultadoCard({ titulo, contenido, colors }) {
  return (
    <View style={[styles.resultCard, { backgroundColor: colors.bg, borderColor: colors.accent }]}>
      <Text style={[styles.resultCardTitle, { color: colors.accent }]}>✨ {titulo}</Text>
      <Text style={[styles.resultCardText, { color: colors.textPrimary }]}>{contenido}</Text>
    </View>
  );
}

function TarjetaResultadoMini({ titulo, texto, colors }) {
  return (
    <View style={[styles.miniCard, { backgroundColor: colors.bg, borderColor: colors.cardBorder }]}>
      <Text style={{ color: colors.accent, fontWeight: 'bold', fontSize: 11 }}>{titulo}</Text>
      <Text style={{ color: colors.textPrimary, fontSize: 11, marginTop: 2 }}>{texto}</Text>
    </View>
  );
}

function SubModuloTarjeta({ titulo, cartas, colors, onSelectSlot }) {
  return (
    <View style={[styles.subCard, { backgroundColor: colors.bg, borderColor: colors.cardBorder }]}>
      <Text style={[styles.subCardTitle, { color: colors.accent }]}>{titulo}</Text>
      {cartas.map((c, i) => (
        <TouchableOpacity key={i} style={[styles.slotSmall, { borderColor: colors.cardBorder }]} onPress={() => onSelectSlot(i)}>
          <Text style={{ color: colors.textPrimary, fontSize: 10, textAlign: 'center' }} numberOfLines={1}>{c || '+ Carta'}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function ModuloSlots({ cartas, colors, onSelectSlot }) {
  return (
    <View style={styles.slotsRow}>
      {cartas.map((c, i) => (
        <TouchableOpacity key={i} style={[styles.slot, { backgroundColor: colors.bg, borderColor: colors.cardBorder }]} onPress={() => onSelectSlot(i)}>
          <Text style={[styles.slotText, { color: colors.accent }]}>{c || '+ Seleccionar'}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerBtns: { flexDirection: 'row', gap: 6 },
  headerSub: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  headerTitle: { fontSize: 16, fontWeight: 'bold' },
  btnTema: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  btnHistory: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  btnHistoryText: { fontSize: 11, fontWeight: '700' },
  card: { borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1 },
  cardTitle: { fontSize: 14, fontWeight: '600', marginBottom: 10 },
  labelInput: { fontSize: 11, marginBottom: 6 },
  subCard: { flex: 1, marginHorizontal: 2, padding: 8, borderRadius: 8, borderWidth: 1 },
  subCardTitle: { fontSize: 11, fontWeight: '700', marginBottom: 6 },
  tripticoGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  slotsRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  slot: { flex: 1, paddingVertical: 10, paddingHorizontal: 4, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  slotText: { fontSize: 10, fontWeight: '600', textAlign: 'center' },
  slotSmall: { paddingVertical: 6, paddingHorizontal: 4, borderRadius: 6, marginBottom: 4, borderWidth: 1 },
  input: { borderRadius: 8, padding: 10, fontSize: 12, marginBottom: 10, borderWidth: 1 },
  btnModulo: { borderRadius: 8, paddingVertical: 10, alignItems: 'center', marginTop: 4 },
  btnModuloText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 12 },
  resultCard: { marginTop: 12, padding: 12, borderRadius: 10, borderWidth: 1 },
  resultCardTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  resultCardText: { fontSize: 12, lineHeight: 18 },
  tripticoResContainer: { marginTop: 10, gap: 6 },
  miniCard: { padding: 8, borderRadius: 8, borderWidth: 1 },
  calendarStrip: { flexDirection: 'row', marginBottom: 12 },
  calendarDay: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, marginRight: 6, alignItems: 'center' },
  sectionSubtitle: { fontSize: 11, fontWeight: '700', marginBottom: 10 },
  historicoCard: { padding: 10, borderRadius: 8, borderWidth: 1, marginBottom: 8 },
  historicoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historicoTag: { fontSize: 10, fontWeight: 'bold' },
  btnTrash: { backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  resText: { fontSize: 12, lineHeight: 18 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  toggleInv: { padding: 10, borderRadius: 8, borderWidth: 1, marginBottom: 12, alignItems: 'center' },
  itemCarta: { paddingVertical: 12, borderBottomWidth: 1 },
  btnCerrarModal: { marginTop: 12, padding: 12, borderRadius: 8, alignItems: 'center' },
});