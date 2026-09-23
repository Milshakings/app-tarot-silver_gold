// src/screens/DashboardScreen.jsx
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  FlatList,
  Alert
} from 'react-native';
import { procesarLecturaTarot } from '../services/geminiService';

// Baraja Completa: 78 Cartas del Tarot
const BARAJA_COMPLETA = [
  // Arcanos Mayores
  'El Loco', 'El Mago', 'La Sacerdotisa', 'La Emperatriz', 'El Emperador',
  'El Sumo Sacerdote', 'Los Enamorados', 'El Carro', 'La Fuerza', 'El Ermitaño',
  'La Rueda de la Fortuna', 'La Justicia', 'El Colgado', 'La Muerte', 'La Templanza',
  'El Diablo', 'La Torre', 'La Estrella', 'La Luna', 'El Sol', 'El Juicio', 'El Mundo',
  // Bastos
  'As de Bastos', 'Dos de Bastos', 'Tres de Bastos', 'Cuatro de Bastos', 'Cinco de Bastos',
  'Seis de Bastos', 'Siete de Bastos', 'Ocho de Bastos', 'Nueve de Bastos', 'Diez de Bastos',
  'Sota de Bastos', 'Caballo de Bastos', 'Reina de Bastos', 'Rey de Bastos',
  // Copas
  'As de Copas', 'Dos de Copas', 'Tres de Copas', 'Cuatro de Copas', 'Cinco de Copas',
  'Seis de Copas', 'Siete de Copas', 'Ocho de Copas', 'Nueve de Copas', 'Diez de Copas',
  'Sota de Copas', 'Caballo de Copas', 'Reina de Copas', 'Rey de Copas',
  // Espadas
  'As de Espadas', 'Dos de Espadas', 'Tres de Espadas', 'Cuatro de Espadas', 'Cinco de Espadas',
  'Seis de Espadas', 'Siete de Espadas', 'Ocho de Espadas', 'Nueve de Espadas', 'Diez de Espadas',
  'Sota de Espadas', 'Caballo de Espadas', 'Reina de Espadas', 'Rey de Espadas',
  // Oros / Pentáculos
  'As de Oros', 'Dos de Oros', 'Tres de Oros', 'Cuatro de Oros', 'Cinco de Oros',
  'Seis de Oros', 'Siete de Oros', 'Ocho de Oros', 'Nueve de Oros', 'Diez de Oros',
  'Sota de Oros', 'Caballo de Oros', 'Reina de Oros', 'Rey de Oros'
];

export default function DashboardScreen(props) {
  const colors = props.colors || {
    bg: '#0F0E17',
    cardBg: '#1F1B24',
    cardBorder: '#332940',
    textPrimary: '#FFFFFE',
    textSecondary: '#A7A9BE',
    accent: '#FF8906',
  };

  const [cartas, setCartas] = useState({
    sensacion: [null, null, null],
    gratitud: [null, null, null],
    triptico: {
      amor: [null, null],
      dinero: [null, null],
      salud: [null, null],
    },
    terapeutica: [null, null, null],
  });

  const [preguntaTexto, setPreguntaTexto] = useState('');
  const [resultados, setResultados] = useState({});
  const [loadingModulo, setLoadingModulo] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [slotActivo, setSlotActivo] = useState(null); // { modulo, subcategoria, index }

  const abrirSelector = (modulo, index, subcategoria = null) => {
    setSlotActivo({ modulo, index, subcategoria });
    setModalVisible(true);
  };

  const seleccionarCarta = (nombreCarta) => {
    if (!slotActivo) return;
    const { modulo, index, subcategoria } = slotActivo;

    setCartas((prev) => {
      if (modulo === 'triptico') {
        const nuevasSub = [...prev.triptico[subcategoria]];
        nuevasSub[index] = nombreCarta;
        return {
          ...prev,
          triptico: {
            ...prev.triptico,
            [subcategoria]: nuevasSub,
          },
        };
      } else {
        const nuevasCartasModulo = [...prev[modulo]];
        nuevasCartasModulo[index] = nombreCarta;
        return { ...prev, [modulo]: nuevasCartasModulo };
      }
    });

    setModalVisible(false);
    setSlotActivo(null);
  };

  const procesarModulo = async (modulo) => {
    if (modulo === 'triptico') {
      const { amor, dinero, salud } = cartas.triptico;
      if (amor.some((c) => !c) || dinero.some((c) => !c) || salud.some((c) => !c)) {
        const msj = 'Por favor selecciona las 2 cartas para Amor, 2 para Dinero y 2 para Salud antes de procesar.';
        if (typeof window !== 'undefined') window.alert(msj);
        else Alert.alert('Atención', msj);
        return;
      }
    } else {
      const cartasSeleccionadas = cartas[modulo];
      if (cartasSeleccionadas.some((c) => !c)) {
        const msj = 'Por favor selecciona las 3 cartas para este módulo antes de procesar.';
        if (typeof window !== 'undefined') window.alert(msj);
        else Alert.alert('Atención', msj);
        return;
      }
    }

    if (modulo === 'terapeutica' && (!preguntaTexto || preguntaTexto.trim() === '')) {
      const msj = 'Por favor ingresa tu pregunta abierta antes de procesar.';
      if (typeof window !== 'undefined') window.alert(msj);
      else Alert.alert('Atención', msj);
      return;
    }

    setLoadingModulo(modulo);

    try {
      const payload = {
        tipo: modulo,
        cartas: modulo === 'triptico' ? cartas.triptico : cartas[modulo],
        pregunta: modulo === 'terapeutica' ? preguntaTexto : undefined,
      };

      const res = await procesarLecturaTarot(payload);
      setResultados((prev) => ({ ...prev, [modulo]: res }));
    } catch (err) {
      console.error(`Error procesando módulo ${modulo}:`, err);
    } finally {
      setLoadingModulo(null);
    }
  };

  const renderSlots3 = (modulo) => (
    <View style={styles.slotsRow}>
      {[0, 1, 2].map((idx) => {
        const carta = cartas[modulo][idx];
        return (
          <TouchableOpacity
            key={idx}
            style={[styles.slot, { backgroundColor: colors.bg, borderColor: colors.cardBorder }]}
            onPress={() => abrirSelector(modulo, idx)}
          >
            <Text style={[styles.slotTexto, { color: carta ? colors.accent : colors.textSecondary }]}>
              {carta || `Carta ${idx + 1}`}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderSlotsTriptico = (subcategoria, titulo) => (
    <View style={styles.subSeccionTriptico}>
      <Text style={[styles.subTituloTriptico, { color: colors.textSecondary }]}>{titulo}</Text>
      <View style={styles.slotsRow}>
        {[0, 1].map((idx) => {
          const carta = cartas.triptico[subcategoria][idx];
          return (
            <TouchableOpacity
              key={idx}
              style={[styles.slot, { backgroundColor: colors.bg, borderColor: colors.cardBorder }]}
              onPress={() => abrirSelector('triptico', idx, subcategoria)}
            >
              <Text style={[styles.slotTexto, { color: carta ? colors.accent : colors.textSecondary }]}>
                {carta || `Carta ${idx + 1}`}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* MÓDULO 1: SENSACIONES DIARIAS */}
      <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>✨ Sensaciones Diarias</Text>
        {renderSlots3('sensacion')}
        <TouchableOpacity
          style={[styles.btnModulo, { backgroundColor: colors.accent }]}
          onPress={() => procesarModulo('sensacion')}
          disabled={loadingModulo === 'sensacion'}
        >
          {loadingModulo === 'sensacion' ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnModuloText}>Procesar Sensaciones</Text>}
        </TouchableOpacity>

        {resultados.sensacion && (
          <View style={[styles.cardResultado, { backgroundColor: colors.bg, borderColor: colors.cardBorder }]}>
            <Text style={[styles.tituloResultado, { color: colors.accent }]}>✨ Interpretación Completa</Text>
            <Text style={[styles.textoResultado, { color: colors.textPrimary }]}>{resultados.sensacion}</Text>
          </View>
        )}
      </View>

      {/* MÓDULO 2: GRATITUD DIARIA */}
      <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>🌱 Gratitud Diaria</Text>
        {renderSlots3('gratitud')}
        <TouchableOpacity
          style={[styles.btnModulo, { backgroundColor: colors.accent }]}
          onPress={() => procesarModulo('gratitud')}
          disabled={loadingModulo === 'gratitud'}
        >
          {loadingModulo === 'gratitud' ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnModuloText}>Procesar Gratitud</Text>}
        </TouchableOpacity>

        {resultados.gratitud && (
          <View style={[styles.cardResultado, { backgroundColor: colors.bg, borderColor: colors.cardBorder }]}>
            <Text style={[styles.tituloResultado, { color: colors.accent }]}>🌱 Lectura de Gratitud</Text>
            <Text style={[styles.textoResultado, { color: colors.textPrimary }]}>{resultados.gratitud}</Text>
          </View>
        )}
      </View>

      {/* MÓDULO 3: TRÍPTICO DE CONSEJOS (AMOR, DINERO, SALUD) */}
      <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>⏳ Tríptico de Consejos</Text>
        
        {renderSlotsTriptico('amor', '❤️ Amor (2 Cartas)')}
        {renderSlotsTriptico('dinero', '💰 Dinero y Trabajo (2 Cartas)')}
        {renderSlotsTriptico('salud', '🌿 Salud y Bienestar (2 Cartas)')}

        <TouchableOpacity
          style={[styles.btnModulo, { backgroundColor: colors.accent, marginTop: 8 }]}
          onPress={() => procesarModulo('triptico')}
          disabled={loadingModulo === 'triptico'}
        >
          {loadingModulo === 'triptico' ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnModuloText}>Procesar Consejos del Tríptico</Text>}
        </TouchableOpacity>

        {resultados.triptico && (
          <View style={[styles.cardResultado, { backgroundColor: colors.bg, borderColor: colors.cardBorder }]}>
            <Text style={[styles.tituloResultado, { color: colors.accent }]}>⏳ Consejos del Tríptico</Text>
            <Text style={[styles.textoResultado, { color: colors.textPrimary }]}>{resultados.triptico}</Text>
          </View>
        )}
      </View>

      {/* MÓDULO 4: PREGUNTA TERAPÉUTICA */}
      <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>🔮 Pregunta Terapéutica & Consulta Abierta</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.bg, color: colors.textPrimary, borderColor: colors.cardBorder }]}
          placeholder="Escribe tu inquietud abierta..."
          placeholderTextColor={colors.textSecondary}
          value={preguntaTexto}
          onChangeText={setPreguntaTexto}
          multiline
        />
        {renderSlots3('terapeutica')}
        <TouchableOpacity
          style={[styles.btnModulo, { backgroundColor: colors.accent }]}
          onPress={() => procesarModulo('terapeutica')}
          disabled={loadingModulo === 'terapeutica'}
        >
          {loadingModulo === 'terapeutica' ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnModuloText}>Procesar Orientación Terapéutica</Text>}
        </TouchableOpacity>

        {resultados.terapeutica && (
          <View style={[styles.cardResultado, { backgroundColor: colors.bg, borderColor: colors.cardBorder }]}>
            <Text style={[styles.tituloResultado, { color: colors.accent }]}>🔮 Orientación Holística</Text>
            <Text style={[styles.textoResultado, { color: colors.textPrimary }]}>{resultados.terapeutica}</Text>
          </View>
        )}
      </View>

      {/* MODAL DE SELECCIÓN DE BARAJA DE 78 CARTAS */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBg }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Selecciona una Carta (Baraja 78)</Text>
            <FlatList
              data={BARAJA_COMPLETA}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, { borderBottomColor: colors.cardBorder }]}
                  onPress={() => seleccionarCarta(item)}
                >
                  <Text style={[styles.modalItemText, { color: colors.textPrimary }]}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={[styles.btnCerrarModal, { backgroundColor: colors.accent }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.btnModuloText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 20 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  subSeccionTriptico: { marginBottom: 12 },
  subTituloTriptico: { fontSize: 14, fontWeight: 'bold', marginBottom: 6 },
  slotsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  slot: { flex: 1, height: 48, borderRadius: 8, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginHorizontal: 4, paddingHorizontal: 4 },
  slotTexto: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  input: { borderRadius: 8, borderWidth: 1, padding: 10, marginBottom: 12, minHeight: 60 },
  btnModulo: { borderRadius: 8, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  btnModuloText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  cardResultado: { marginTop: 16, padding: 14, borderRadius: 8, borderWidth: 1 },
  tituloResultado: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  textoResultado: { fontSize: 14, lineHeight: 22 },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalContent: { borderRadius: 12, padding: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  modalItem: { paddingVertical: 12, borderBottomWidth: 1 },
  modalItemText: { fontSize: 15, textAlign: 'center' },
  btnCerrarModal: { marginTop: 12, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
});