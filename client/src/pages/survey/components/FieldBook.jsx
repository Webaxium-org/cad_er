import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getSurvey, getSurveyPurpose } from '../../../services/surveyServices';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import BasicButtons from '../../../components/BasicButton';
import { useDispatch, useSelector } from 'react-redux';
import { startLoading, stopLoading } from '../../../redux/loadingSlice';
import { handleFormError } from '../../../utils/handleFormError';
import { MdArrowBackIosNew } from 'react-icons/md';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Stack,
} from '@mui/material';

export default function FieldBook() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { global } = useSelector((state) => state.loading);

  const [purpose, setPurpose] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!global) dispatch(startLoading());
        const { data } = await getSurveyPurpose(id);
        if (data.success) {
          setPurpose(data.purpose);
        } else {
          throw Error('Something went wrong');
        }
      } catch (error) {
        handleFormError(error, null, dispatch, navigate);
      } finally {
        dispatch(stopLoading());
      }
    };
    fetchData();
  }, [id]);

  // 🔸 Compute table data from survey rows
  const tableData = useMemo(() => {
    if (!purpose) return [];

    const survey = purpose.surveyId;

    let hi = 0; // Height of Instrument
    let rl = 0; // Reduced Level
    const rows = [];

    for (const row of purpose.rows) {
      switch (row.type) {
        case 'Instrument setup':
          rl = Number(survey.reducedLevel || 0);
          hi = rl + Number(row.backSight || 0);
          rows.push({
            CH: '-',
            BS: row.backSight || '-',
            IS: '-',
            FS: '-',
            HI: hi.toFixed(3),
            RL: rl.toFixed(3),
            Offset: '-',
            Remarks: row.remarks?.[0] || '-',
          });
          break;

        case 'Chainage':
          row.intermediateSight?.forEach((isVal, i) => {
            const rlValue = (hi - Number(isVal || 0)).toFixed(3);
            rows.push({
              CH: i === 0 ? row.chainage : '',
              BS: '-',
              IS: isVal || '-',
              FS: '-',
              HI: hi.toFixed(3),
              RL: rlValue,
              Offset: row.offsets?.[i] || '-',
              Remarks: row.remarks?.[i] || '-',
            });
          });
          break;

        case 'TBM':
          row.intermediateSight?.forEach((isVal, i) => {
            const rlValue = (hi - Number(isVal || 0)).toFixed(3);
            rows.push({
              CH: '-',
              BS: '-',
              IS: isVal || '-',
              FS: '-',
              HI: hi.toFixed(3),
              RL: rlValue,
              Offset: row.offsets?.[i] || '-',
              Remarks: row.remarks?.[i] || '-',
            });
          });
          break;

        case 'CP':
          rl = Number(hi) - Number(row.foreSight);
          hi = Number(rl) + Number(row.backSight || 0);
          rows.push({
            CH: '-',
            BS: row.backSight || '-',
            IS: '-',
            FS: row.foreSight || '-',
            HI: hi.toFixed(3),
            RL: rl.toFixed(3),
            Offset: '-',
            Remarks: row.remarks?.[0] || '-',
          });
          break;

        default:
          break;
      }
    }

    return rows;
  }, [purpose]);

  const exportToExcel = () => {
    if (!purpose) return;

    const headers = ['CH', 'BS', 'IS', 'FS', 'HI', 'RL'];

    // Create worksheet from table data (start from row 5)
    const worksheet = XLSX.utils.json_to_sheet(tableData, {
      header: headers,
      origin: 'A5',
    });

    // Add custom header section (rows 1–3)
    const headerSection = [
      [
        `Purpose: ${purpose.type}`,
        '',
        '',
        '',
        `Name of Officer: N/A`,
        '',
        '',
        '',
      ],
      [
        `Date of Survey: ${new Date().toLocaleDateString()}`,
        '',
        '',
        '',
        'Designation: Assistant Engineer',
        '',
        '',
        '',
      ],
      [
        `Instrument No: ${purpose?.surveyId?.instrumentNo}`,
        '',
        '',
        '',
        'Department: N/A',
        '',
        '',
        '',
      ],
    ];

    XLSX.utils.sheet_add_aoa(worksheet, headerSection, { origin: 'A1' });

    // ✅ Corrected merge ranges (A–D for left, E–H for right)
    worksheet['!merges'] = [
      // Row 1
      { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, // A1:D1 - Purpose
      { s: { r: 0, c: 4 }, e: { r: 0, c: 7 } }, // E1:H1 - Name of Officer

      // Row 2
      { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }, // A2:D2 - Date
      { s: { r: 1, c: 4 }, e: { r: 1, c: 7 } }, // E2:H2 - Designation

      // Row 3
      { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } }, // A3:D3 - Instrument No
      { s: { r: 2, c: 4 }, e: { r: 2, c: 7 } }, // E3:H3 - Department
    ];

    // Optional: Adjust column widths for readability
    worksheet['!cols'] = [
      { wch: 15 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 15 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
    ];

    // Create workbook and export
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'AE');

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(blob, `Survey_${purpose?.type}.xlsx`);
  };

  if (!purpose) {
    return <Typography p={2}>Loading purpose details...</Typography>;
  }

  return (
    <Box p={2}>
      <Stack direction={'row'} spacing={2} mb={2}>
        <Box
          sx={{
            border: '1px solid #EFEFEF',
            borderRadius: '9px',
            width: '40px',
            height: '40px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'pointer',
            mb: '24px',
          }}
          onClick={() => navigate('/')}
        >
          <MdArrowBackIosNew />
        </Box>

        <BasicButtons
          variant="contained"
          sx={{ mb: 2 }}
          onClick={exportToExcel}
          value="Download Excel 📥"
        />
      </Stack>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} size="small">
          <TableHead sx={{ backgroundColor: '#f4f6f8' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>CH</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">
                BS
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">
                IS
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">
                FS
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">
                HI
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">
                RL
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">
                Offset
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">
                Remarks
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {tableData.map((row, index) => (
              <TableRow key={index}>
                <TableCell>{row.CH}</TableCell>
                <TableCell align="right">{row.BS}</TableCell>
                <TableCell align="right">{row.IS}</TableCell>
                <TableCell align="right">{row.FS}</TableCell>
                <TableCell align="right">{row.HI}</TableCell>
                <TableCell align="right">{row.RL}</TableCell>
                <TableCell align="right">{row.Offset}</TableCell>
                <TableCell align="right">{row.Remarks}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
