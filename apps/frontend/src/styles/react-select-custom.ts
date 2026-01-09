import { StylesConfig } from 'react-select';

// Estilos personalizados de react-select para que coincidan con el theme del proyecto
export const customSelectStyles: StylesConfig = {
  control: (base, state) => ({
    ...base,
    minHeight: '38px',
    fontSize: '14px',
    borderColor: state.isFocused ? '#1D546D' : '#dee2e6',
    boxShadow: state.isFocused ? '0 0 0 0.25rem rgba(29, 84, 109, 0.25)' : 'none',
    '&:hover': {
      borderColor: '#1D546D'
    }
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected 
      ? '#1D546D' 
      : state.isFocused 
      ? 'rgba(95, 149, 152, 0.2)' 
      : 'white',
    color: state.isSelected ? 'white' : '#212529',
    '&:active': {
      backgroundColor: '#5F9598'
    }
  }),
  menu: (base) => ({
    ...base,
    zIndex: 1050
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: 'rgba(95, 149, 152, 0.2)'
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: '#1D546D'
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: '#1D546D',
    '&:hover': {
      backgroundColor: '#5F9598',
      color: 'white'
    }
  })
};

// Variante small para formularios compactos
export const customSelectStylesSmall: StylesConfig = {
  ...customSelectStyles,
  control: (base, state) => ({
    ...(customSelectStyles.control as any)(base, state),
    minHeight: '31px',
    fontSize: '14px'
  })
};
