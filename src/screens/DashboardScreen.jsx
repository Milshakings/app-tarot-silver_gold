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

// Arcanos Mayores para el selector
const ARCANOS_MAYORES = [
  'El Loco', 'El Mago', 'La Sacerdotisa', 'La Emperatriz', 'El Emperador',
  'El Sumo Sacerdote', 'Los Enamorados', 'El Carro', 'La Fuerza', 'El Ermitaño',
  'La Rueda de la Fortuna', 'La Justicia', 'El Colgado', 'La Muerte', 'La Templanza',
  'El Diablo', 'La Torre', 'La Estrella', 'La Luna', 'El Sol', 'El Juicio', 'El Mundo'
];

export default function DashboardScreen({ colors }) {
  // Estado para la selección de cartas de los 4 módulos
  const [cartas, setCartas] = useState({
    sensacion: [null, null, null],
    gratitud: [null, null, null],
    triptico: [null, null, null],
    terapeutica: [null, null, null],
  });

  // Estado para la pregunta abierta del Módulo 4
  const [preguntaTexto, setPreguntaTexto] = useState('');

  // Estado para las respuestas procesadas
  const [resultados, setResultados] = useState({});

  // Estado de carga por módulo
  const [loadingModulo, setLoadingModulo] = useState(null);

  // Estado del Modal de Selección de Carta
  const [modalVisible, setModalVisible] = useState(false);
  const [slotActivo, setSlotActivo] = useState(null); // { modulo: 'sensacion', index: 0 }

  // Función para abrir el modal de selección de carta
  const abrirSelector = (modulo, index) => {
    setSlotActivo({ modulo, index });
    setModalVisible(true);
  };

  // Función para asignar la carta seleccionada
  const seleccionarCarta = (nombreCarta) => {
    if (!slotActivo) return;
    const { modulo, index } = slotActivo;

    setCartas((prev) => {
      const nuevasCartasModulo = [...prev[modulo]];
      nuevasCartasModulo[index] = nombreCarta;
      return { ...prev, [modulo]: nuevasCartasModulo };
    });

    setModalVisible(false);
    setSlotActivo(null);
  };

  // Función para procesar la lectura según el módulo
  const procesarModulo = async (modulo) => {
    const cartasSeleccionadas = cartas[modulo];

    if (cartasSeleccionadas.some((c) => !c)) {
      Alert.alert('Atención', 'Por favor selecciona las 3 cartas para este módulo antes de procesar.');
      return;
    }

    if (modulo === 'terapeutica' && (!preguntaTexto || preguntaTexto.trim() === '')) {
      Alert.alert('Atención', 'Por favor ingresa tu pregunta abierta antes de procesar.');
      return;
    }

    setLoadingModulo(modulo);

    try {
      const payload = {
        tipo: modulo,
        cartas: cartasSeleccionadas,
        pregunta: modulo === 'terapeutica' ? preguntaTexto : undefined,
      };

      const res = await procesarLecturaTarot(payload);

      setResultados((prev) => ({
        ...prev,
        [modulo]: res,
      }));
    } catch (err) {
      console.error(`Error procesando módulo ${modulo}:`, err);
      Alert.alert('Error', 'No se pudo generar la lectura. Intenta nuevamente.');
    } finally {
      setLoadingModulo(null);
    }
  };

  // Subcomponente para los 3 slots de cartas de cada módulo
  const renderSlots = (modulo) => (
    <View style={styles.slotsRow}>
      {[0, 1, 2].map((idx) => {
        const carta = cartas[modulo][idx];
        return (
          <TouchableOpacity
            key={idx}
            style={[
              styles.slot,
              { backgroundColor: colors.bg, borderColor: colors.cardBorder },
            ]}
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

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* MÓDULO 1: SENSACIONES DIARIAS */}
      <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>✨ Sensaciones Diarias</Text>
        {renderSlots('sensacion')}
        <TouchableOpacity
          style={[styles.btnModulo, { backgroundColor: colors.accent }]}
          onPress={() => procesarModulo('sensacion')}
          disabled={loadingModulo === 'sensacion'}
        >
          {loadingModulo === 'sensacion' ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.btnModuloText}>Procesar Sensaciones</Text>
          )}
        </TouchableOpacity>

        {resultados.sensacion && (
          <View style={[styles.cardResultado, { backgroundColor: colors.bg, borderColor: colors.cardBorder }]}>
            <Text style={[styles.tituloResultado, { color: colors.accent }]}>✨ Compendio de Sensaciones Diarias</Text>
            {typeof resultados.sensacion === 'string' ? (
              <Text style={[styles.textoResultado, { color: colors.textPrimary }]}>{resultados.sensacion}</Text>
            ) : (
              <>
                {resultados.sensacion.sensacion_general && (
                  <View style={styles.bloqueResultado}>
                    <Text style={[styles.subtituloResultado, { color: colors.textSecondary }]}>🔮 Sensación General:</Text>
                    <Text style={[styles.textoResultado, { color: colors.textPrimary }]}>
                      {resultados.sensacion.sensacion_general}
                    </Text>
                  </View>
                )}
                {resultados.sensacion.mecanismos_cuidado && (
                  <View style={styles.bloqueResultado}>
                    <Text style={[styles.subtituloResultado, { color: colors.textSecondary }]}>🌱 Mecanismos de Cuidado:</Text>
                    <Text style={[styles.textoResultado, { color: colors.textPrimary }]}>
                      {resultados.sensacion.mecanismos_cuidado}
                    </Text>
                  </View>
                )}
                {resultados.sensacion.foco_atencion && (
                  <View style={styles.bloqueResultado}>
                    <Text style={[styles.subtituloResultado, { color: colors.textSecondary }]}>🎯 Foco de Atención:</Text>
                    <Text style={[styles.textoResultado, { color: colors.textPrimary }]}>
                      {resultados.sensacion.foco_atencion}
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        )}
      </View>

      {/* MÓDULO 2: GRATITUD DIARIA */}
      <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>🌱 Gratitud Diaria</Text>
        {renderSlots('gratitud')}
        <TouchableOpacity
          style={[styles.btnModulo, { backgroundColor: colors.accent }]}
          onPress={() => procesarModulo('gratitud')}
          disabled={loadingModulo === 'gratitud'}
        >
          {loadingModulo === 'gratitud' ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.btnModuloText}>Procesar Gratitud</Text>
          )}
        </TouchableOpacity>

        {resultados.gratitud && (
          <View style={[styles.cardResultado, { backgroundColor: colors.bg, borderColor: colors.cardBorder }]}>
            <Text style={[styles.tituloResultado, { color: colors.accent }]}>🌱 Lectura de Gratitud</Text>
            {typeof resultados.gratitud === 'string' ? (
              <Text style={[styles.textoResultado, { color: colors.textPrimary }]}>{resultados.gratitud}</Text>
            ) : (
              <>
                {resultados.gratitud.reconocimiento && (
                  <View style={styles.bloqueResultado}>
                    <Text style={[styles.subtituloResultado, { color: colors.textSecondary }]}>🙏 Reconocimiento:</Text>
                    <Text style={[styles.textoResultado, { color: colors.textPrimary }]}>{resultados.gratitud.reconocimiento}</Text>
                  </View>
                )}
                {resultados.gratitud.aprendizaje && (
                  <View style={styles.bloqueResultado}>
                    <Text style={[styles.subtituloResultado, { color: colors.textSecondary }]}>💡 Aprendizaje:</Text>
                    <Text style={[styles.textoResultado, { color: colors.textPrimary }]}>{resultados.gratitud.aprendizaje}</Text>
                  </View>
                )}
                {resultados.gratitud.integracion && (
                  <View style={styles.bloqueResultado}>
                    <Text style={[styles.subtituloResultado, { color: colors.textSecondary }]}>✨ Integración:</Text>
                    <Text style={[styles.textoResultado, { color: colors.textPrimary }]}>{resultados.gratitud.integracion}</Text>
                  </View>
                )}
              </>
            )}
          </View>
        )}
      </View>

      {/* MÓDULO 3: TRÍPTICO EVOLUTIVO */}
      <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>⏳ Tríptico Temporal (Pasado - Presente - Futuro)</Text>
        {renderSlots('triptico')}
        <TouchableOpacity
          style={[styles.btnModulo, { backgroundColor: colors.accent }]}
          onPress={() => procesarModulo('triptico')}
          disabled={loadingModulo === 'triptico'}
        >
          {loadingModulo === 'triptico' ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.btnModuloText}>Procesar Tríptico</Text>
          )}
        </TouchableOpacity>

        {resultados.triptico && (
          <View style={[styles.cardResultado, { backgroundColor: colors.bg, borderColor: colors.cardBorder }]}>
            <Text style={[styles.tituloResultado, { color: colors.accent }]}>⏳ Tríptico Evolutivo</Text>
            {typeof resultados.triptico === 'string' ? (
              <Text style={[styles.textoResultado, { color: colors.textPrimary }]}>{resultados.triptico}</Text>
            ) : (
              <>
                {resultados.triptico.pasado && (
                  <View style={styles.bloqueResultado}>
                    <Text style={[styles.subtituloResultado, { color: colors.textSecondary }]}>🔙 Pasado / Origen:</Text>
                    <Text style={[styles.textoResultado, { color: colors.textPrimary }]}>{resultados.triptico.pasado}</Text>
                  </View>
                )}
                {resultados.triptico.presente && (
                  <View style={styles.bloqueResultado}>
                    <Text style={[styles.subtituloResultado, { color: colors.textSecondary }]}>📍 Presente / Situación:</Text>
                    <Text style={[styles.textoResultado, { color: colors.textPrimary }]}>{resultados.triptico.presente}</Text>
                  </View>
                )}
                {resultados.triptico.futuro && (
                  <View style={styles.bloqueResultado}>
                    <Text style={[styles.subtituloResultado, { color: colors.textSecondary }]}>🔮 Futuro / Proyección:</Text>
                    <Text style={[styles.textoResultado, { color: colors.textPrimary }]}>{resultados.triptico.futuro}</Text>
                  </View>
                )}
              </>
            )}
          </View>
        )}
      </View>

      {/* MÓDULO 4: PREGUNTA TERAPÉUTICA (CONSULTA ABIERTA) */}
      <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>🔮 Pregunta Terapéutica & Consulta Abierta</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.bg, color: colors.textPrimary, borderColor: colors.cardBorder }]}
          placeholder="Escribe tu inquietud abierta (Ej: ¿Qué debo aprender de este bloqueo laboral y cómo abordarlo?)"
          placeholderTextColor={colors.textSecondary}
          value={preguntaTexto}
          onChangeText={setPreguntaTexto}
          multiline
        />
        {renderSlots('terapeutica')}
        <TouchableOpacity
          style={[styles.btnModulo, { backgroundColor: colors.accent }]}
          onPress={() => procesarModulo('terapeutica')}
          disabled={loadingModulo === 'terapeutica'}
        >
          {loadingModulo === 'terapeutica' ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.btnModuloText}>Procesar Orientación Terapéutica</Text>
          )}
        </TouchableOpacity>

        {resultados.terapeutica && (
          <View style={[styles.cardResultado, { backgroundColor: colors.bg, borderColor: colors.cardBorder }]}>
            <Text style={[styles.tituloResultado, { color: colors.accent }]}>🔮 Orientación Terapéutica IA</Text>
            <Text style={[styles.textoResultado, { color: colors.textPrimary }]}>
              {typeof resultados.terapeutica === 'string'
                ? resultados.terapeutica
                : resultados.terapeutica.pregunta_reflexion ||
                  resultados.terapeutica.resumen ||
                  JSON.stringify(resultados.terapeutica)}
            </Text>
          </View>
        )}
      </View>

      {/* MODAL DE SELECCIÓN DE ARCANOS */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBg }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Selecciona un Arcano</Text>
            <FlatList
              data={ARCANOS_MAYORES}
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
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  slotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  slot: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    paddingHorizontal: 4,
  },
  slotTexto: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    marginBottom: 12,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  btnModulo: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnModuloText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  cardResultado: {
    marginTop: 16,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
  },
  tituloResultado: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  bloqueResultado: {
    marginTop: 8,
    marginBottom: 6,
  },
  subtituloResultado: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  textoResultado: {
    fontSize: 14,
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalItemText: {
    fontSize: 15,
    textAlign: 'center',
  },
  btnCerrarModal: {
    marginTop: 12,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
});
