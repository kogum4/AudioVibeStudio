import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { UploadScreen } from './screens/UploadScreen';
import { EditorScreen } from './screens/EditorScreen';
import { ExportScreen } from './screens/ExportScreen';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<UploadScreen />} />
          <Route path="editor" element={<EditorScreen />} />
          <Route path="export" element={<ExportScreen />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;