import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getSurveyPurpose } from '../../../services/surveyServices';
import ExcelJS from 'exceljs';
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
import { MdDownload } from 'react-icons/md';

import { purposeCode } from '../../../constants';
import { IoIosAddCircleOutline } from 'react-icons/io';

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

    const finalForeSight = Number(purpose.finalForesight);

    // const finalForeSight =
    //   Number(rows[rows.length - 1].HI) - Number(survey.reducedLevel);

    const finalRl = Number(rows[rows.length - 1].HI) - finalForeSight;

    const diff = finalRl - Number(survey.reducedLevel);

    rows.push({
      CH: '',
      BS: '',
      IS: '',
      FS: finalForeSight?.toFixed(3),
      HI: '',
      RL: Number(finalRl)?.toFixed(3),
      Offset: '',
      diff,
      Remarks: `Closed on Starting TBM at ${
        diff === 0
          ? '±0.000'
          : diff < 0
          ? `${diff?.toFixed(3)}`
          : `+${diff?.toFixed(3)}`
      }`,
    });

    return rows;
  }, [purpose]);

  const exportToExcel = async () => {
    if (!purpose) return;

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(`${purposeCode[purpose.type]} AE`);

    // ======= TITLE =======
    sheet.mergeCells('A1:H1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = purpose?.surveyId?.project;
    titleCell.font = { size: 18, bold: true };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getRow(1).height = 28;

    // ======= HEADER SECTION =======
    sheet.mergeCells('A2:D2');
    sheet.mergeCells('E2:H2');
    sheet.mergeCells('A3:D3');
    sheet.mergeCells('E3:H3');
    sheet.mergeCells('A4:D4');
    sheet.mergeCells('E4:H4');

    sheet.getCell('A2').value = `Purpose: ${purpose.type}`;
    sheet.getCell('E2').value = 'Name of Officer: N/A';
    sheet.getCell(
      'A3'
    ).value = `Date of Survey: ${new Date().toLocaleDateString()}`;
    sheet.getCell('E3').value = 'Designation: Assistant Engineer';
    sheet.getCell('A4').value = `Instrument No: ${
      purpose?.surveyId?.instrumentNo || 'N/A'
    }`;
    sheet.getCell('E4').value = 'Department: N/A';

    sheet.getRows(2, 3).forEach((row) => {
      row.height = 22;
      row.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: '212121' } };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      });
    });

    // ======= SPACER =======
    sheet.addRow([]);

    // ======= TABLE HEADERS =======
    const headers = ['CH', 'BS', 'IS', 'FS', 'HI', 'RL', 'Offset', 'Remarks'];
    const headerRow = sheet.addRow(headers);

    headerRow.height = 25;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, size: 12 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // ======= TABLE DATA =======
    tableData.forEach((data, i) => {
      const row = sheet.addRow([
        data.CH,
        data.BS,
        data.IS,
        data.FS,
        data.HI,
        data.RL,
        data.Offset,
        data.Remarks,
      ]);

      row.eachCell((cell, colNumber) => {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };

        if (colNumber === 8) {
          if (data.diff !== undefined && data.diff !== null) {
            cell.font = {
              color: { argb: data.diff === 0 ? 'FF008000' : 'FFFF0000' }, // Green if 0, Red otherwise
            };
          }
        }
      });
    });

    // ======= COLUMN WIDTHS =======
    const colWidths = [12, 12, 12, 12, 12, 12, 12, 36];
    colWidths.forEach((w, i) => (sheet.getColumn(i + 1).width = w));

    // ======= SAVE FILE =======
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(blob, `Survey_${purpose?.type || 'Report'}.xlsx`);
  };

  if (!purpose) {
    return <Typography p={2}>Loading survey details...</Typography>;
  }

  return (
    <Box p={2}>
      <Stack
        direction={'row'}
        justifyContent={'space-between'}
        alignItems={'center'}
        spacing={2}
        mb={2}
      >
        <BasicButtons
          variant="outlined"
          sx={{
            height: '40px',
            width: '40px',
            minWidth: '40px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'pointer',
          }}
          onClick={() => navigate(-1)}
          value={<MdArrowBackIosNew fontSize={'16px'} />}
        />

        <Stack direction={'row'} alignItems={'center'} spacing={1}>
          <BasicButtons
            variant="contained"
            sx={{ py: 1, px: 2, fontSize: '12px', minWidth: '82px' }}
            onClick={exportToExcel}
            value={
              <Stack direction={'row'} alignItems={'center'}>
                Excel
                <MdDownload fontSize={'16px'} />
              </Stack>
            }
          />

          <BasicButtons
            variant="contained"
            sx={{ py: 1, px: 2, fontSize: '12px', minWidth: '82px' }}
            onClick={() => navigate(`/survey/${purpose?.surveyId?._id}/report`)}
            value="Reports"
          />

          <BasicButtons
            variant="contained"
            sx={{ py: 1, px: 2, fontSize: '12px', minWidth: '82px' }}
            onClick={() =>
              navigate(`/survey/road-survey/${purpose?.surveyId?._id}`)
            }
            value={
              <Stack direction={'row'} gap={0.5} alignItems={'center'}>
                <IoIosAddCircleOutline fontSize={'16px'} />
                PL
              </Stack>
            }
          />
        </Stack>
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
                <TableCell
                  align="right"
                  sx={{
                    color:
                      row.diff !== undefined && row.diff !== null
                        ? row.diff === 0
                          ? 'green'
                          : 'red'
                        : '',
                  }}
                >
                  {row.Remarks}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
