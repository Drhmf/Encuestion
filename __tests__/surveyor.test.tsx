import { render, screen, waitFor, act } from '@testing-library/react';
import SurveyorHome from '../src/app/surveyor/page';
import { getActiveSurveys } from '../src/app/actions';

// Mock de Next.js Server Actions para probar UI puramente
jest.mock('../src/app/actions', () => ({
  getActiveSurveys: jest.fn()
}));

// Mock del GPS ya que el corredor de Jest no tiene DOM Geolocation Navigator por defecto
const mockGeolocation = {
    getCurrentPosition: jest.fn()
};
(global as any).navigator.geolocation = mockGeolocation;

describe('App de Encuestador (Flujo UI)', () => {
  it('Carga el estado inicial y muestra surveys activos obtenidos de la base de datos local', async () => {
    // Mockeamos la promesa resuelta
    (getActiveSurveys as jest.Mock).mockResolvedValue([
      { id: 'survey-101', title: 'Estudio Demográfico Norte', status: 'ACTIVE' }
    ]);

    // Set mock local storage to skip login screen
    localStorage.setItem('encuestion_surveyor_session', JSON.stringify({ id: 's-101', access_code: 'TEST01', name: 'Test Surveyor' }));

    await act(async () => {
      render(<SurveyorHome />);
    });
    
    // Luego de 1 tick asíncrono, debería mostrar el mock
    await waitFor(() => {
      expect(screen.getByText('Estudio Demográfico Norte')).toBeInTheDocument();
    });
    
    // Título de la sección
    expect(screen.getByText('Estudios Activos')).toBeInTheDocument();
  });
});
