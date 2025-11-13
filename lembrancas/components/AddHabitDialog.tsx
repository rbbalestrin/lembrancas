import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { Dialog, TextInput, Button, Portal, SegmentedButtons } from 'react-native-paper';
import { HabitFrequency } from '@/types/habit';

interface AddHabitDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (data: {
    name: string;
    description?: string;
    frequency: HabitFrequency;
    color: string;
    category?: string;
  }) => void;
}

const COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
];

export default function AddHabitDialog({ visible, onDismiss, onSubmit }: AddHabitDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [frequency, setFrequency] = useState<HabitFrequency>('daily');
  const [color, setColor] = useState(COLORS[0]);

  // Reset form when dialog is closed
  useEffect(() => {
    if (!visible) {
      setName('');
      setDescription('');
      setCategory('');
      setFrequency('daily');
      setColor(COLORS[0]);
    }
  }, [visible]);

  const handleSubmit = () => {
    if (!name.trim()) {
      return;
    }
    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      frequency,
      color,
      category: category.trim() || undefined,
    });
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>Novo Hábito</Dialog.Title>
        <Dialog.Content>
          <TextInput
            label="Nome *"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={{ marginBottom: 8 }}
          />
          <TextInput
            label="Descrição"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            multiline
            numberOfLines={2}
            style={{ marginBottom: 8 }}
          />
          <TextInput
            label="Categoria"
            value={category}
            onChangeText={setCategory}
            mode="outlined"
            style={{ marginBottom: 8 }}
          />
          <SegmentedButtons
            value={frequency}
            onValueChange={(value) => setFrequency(value as HabitFrequency)}
            buttons={[
              { value: 'daily', label: 'Diário' },
              { value: 'weekly', label: 'Semanal' },
              { value: 'custom', label: 'Custom' },
            ]}
            style={{ marginBottom: 16 }}
          />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {COLORS.map((c) => (
              <Button
                key={c}
                mode={color === c ? 'contained' : 'outlined'}
                buttonColor={c}
                textColor={color === c ? '#fff' : c}
                onPress={() => setColor(c)}
                style={{ width: 50, height: 50, borderRadius: 25 }}
                contentStyle={{ width: 50, height: 50 }}
              />
            ))}
          </View>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancelar</Button>
          <Button onPress={handleSubmit} mode="contained" disabled={!name.trim()}>
            Criar
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

