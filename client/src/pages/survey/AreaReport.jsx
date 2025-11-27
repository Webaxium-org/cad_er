import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { startLoading, stopLoading } from '../../redux/loadingSlice';
import { getSurvey } from '../../services/surveyServices';
import { handleFormError } from '../../utils/handleFormError';
import {
  Box,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { MdArrowBackIosNew } from 'react-icons/md';
import BasicButtons from '../../components/BasicButton';

import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const initialDetails = {
  initialEntry: '',
  secondaryEntry: '',
};

const AreaReport = () => {
  const navigate = useNavigate();

  const { id } = useParams();

  const reportDetails = useRef(initialDetails);

  const { state } = useLocation();

  const dispatch = useDispatch();

  const { global } = useSelector((state) => state.loading);

  const [survey, setSurvey] = useState([]);

  const fetchSurvey = async () => {
    try {
      if (!global) {
        dispatch(startLoading());
      }

      const { data } = await getSurvey(id);

      if (data.success) {
        setSurvey(data.survey || []);
      } else {
        throw Error('Failed to fetch survey');
      }
    } catch (error) {
      handleFormError(error, null, dispatch, navigate);
    } finally {
      dispatch(stopLoading());
    }
  };

  const shortType = (type) => {
    if (!type) return type;
    return type.replace(/^Proposed\s+/i, 'Prop. ');
  };

  const tableData = useMemo(() => {
    let initialEntry = null;
    let secondaryEntry = null;

    if (state && state?.selectedPurposeIds?.length) {
      initialEntry = survey?.purposes?.find(
        (p) => String(p._id) === String(state.selectedPurposeIds[0])
      );
      secondaryEntry = survey?.purposes?.find(
        (p) => String(p._id) === String(state.selectedPurposeIds[1])
      );
    } else {
      initialEntry = survey?.purposes?.find((p) => p.type === 'Initial Level');
      secondaryEntry = survey?.purposes?.find(
        (p) => p.type === 'Proposed Level'
      );
    }

    if (!survey || !initialEntry || !secondaryEntry) return [];

    reportDetails.current = {
      initialEntry: shortType(initialEntry.type),
      secondaryEntry: shortType(secondaryEntry.type),
    };

    const initialRows = initialEntry?.rows ?? [];
    const proposedRows = secondaryEntry?.rows ?? [];
    const rows = [];

    // Process only "Chainage" type rows
    initialRows
      .filter((row) => row.type === 'Chainage')
      .forEach((row) => {
        const proposedRow = proposedRows?.find(
          (p) => p.chainage === row.chainage
        );
        const chainage = row.chainage?.split('/')?.[1] ?? '';

        const data = (row?.offsets ?? []).map((entry, idx) => {
          const initialEntryRL = row?.reducedLevels?.[idx] ?? 0;
          const secondaryEntryRL = proposedRow?.reducedLevels?.[idx] ?? 0;

          const initRL = Number(initialEntryRL);
          const propRL = Number(secondaryEntryRL);
          const offsetVal = Number(entry);
          const prevOffsetVal = Number(row?.offsets?.[idx - 1] ?? 0);

          // Determine whether it's cutting or filling
          const isCutting = initRL > propRL;

          // Shared width (W) for both cutting and filling
          const widthMtr =
            idx === 0 ? '0.000' : (prevOffsetVal - offsetVal).toFixed(3);

          const cuttingAvgMtr = isCutting
            ? ((initRL + propRL) / 2).toFixed(3)
            : '0.000';

          const fillingAvgMtr = isCutting
            ? '0.000'
            : ((propRL + initRL) / 2).toFixed(3);

          return {
            offset: entry,
            initialEntryRL,
            secondaryEntryRL,
            cuttingMtr: isCutting ? (initRL - propRL).toFixed(3) : '0.000',
            cuttingAvgMtr,
            cuttingWMtr: widthMtr,
            cuttingAreaSqMtr: (
              Number(cuttingAvgMtr) * Number(widthMtr)
            ).toFixed(3),
            fillingMtr: isCutting ? '0.000' : (propRL - initRL).toFixed(3),
            fillingAvgMtr,
            fillingWMtr: widthMtr,
            fillingAreaSqMtr: (
              Number(fillingAvgMtr) * Number(widthMtr)
            ).toFixed(3),
          };
        });

        const totalCuttingAreaSqMtr = data.reduce(
          (acc, curr) => acc + Number(curr.cuttingAreaSqMtr || 0),
          0
        );
        const totalFillingAreaSqMtr = data.reduce(
          (acc, curr) => acc + Number(curr.fillingAreaSqMtr || 0),
          0
        );

        rows.push({
          section: Number(chainage),
          data,
          totalCuttingAreaSqMtr,
          totalFillingAreaSqMtr,
        });
      });

    return rows;
  }, [survey]);

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Area Report');

    // ===== Title =====
    sheet.mergeCells('A1:L1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'Area Report';
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // ===== Header Rows =====
    sheet.addRow([
      'Sl.No.',
      'Distance Meters',
      'Initial Level Meters',
      'Prop. Level Meters',
      'Cutting Area',
      '',
      '',
      '',
      'Filling Area',
      '',
      '',
      '',
    ]);

    sheet.addRow([
      '',
      '',
      '',
      '',
      'Cutting Meters',
      'Avg Meters',
      'Width Meters',
      'Area Sq. Mtrs',
      'Filling Meters',
      'Avg Meters',
      'Width Meters',
      'Area Sq. Mtrs',
    ]);

    // ===== Merge Header Cells =====
    sheet.mergeCells('E2:H2'); // Cutting Area
    sheet.mergeCells('I2:L2'); // Filling Area

    // ===== Style Headers =====
    const headerRows = [2, 3];
    headerRows.forEach((r) => {
      const row = sheet.getRow(r);
      row.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: '000000' } };

        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        cell.alignment = {
          horizontal: 'center',
          vertical: 'middle',
          wrapText: true,
        };
      });
    });

    // ===== Data =====
    let currentRow = 3;

    tableData.forEach((section) => {
      // Section Header
      const sectionRow = sheet.addRow([`Section: ${section.section}`]);
      sectionRow.eachCell((cell) => {
        cell.font = { bold: true };

        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      });
      currentRow++;

      // Empty row
      sheet.addRow([]);
      currentRow++;

      // Data rows
      section.data.forEach((entry, idx) => {
        const dataRow = sheet.addRow([
          idx + 1,
          entry.offset,
          entry.initialEntryRL,
          entry.secondaryEntryRL,
          entry.cuttingMtr,
          entry.cuttingAvgMtr,
          entry.cuttingWMtr,
          entry.cuttingAreaSqMtr,
          entry.fillingMtr,
          entry.fillingAvgMtr,
          entry.fillingWMtr,
          entry.fillingAreaSqMtr,
        ]);

        dataRow.eachCell((cell, colNumber) => {
          // Common border + alignment for all cells
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });

        currentRow++;
      });

      // Totals Row
      const totalRow = sheet.addRow([
        '',
        '',
        '',
        '',
        'Total',
        '',
        '',
        Number(section.totalCuttingAreaSqMtr)?.toFixed(3),
        '',
        '',
        '',
        Number(section.totalFillingAreaSqMtr)?.toFixed(3),
      ]);
      totalRow.eachCell((cell) => {
        cell.font = { bold: true };

        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });
      currentRow++;

      // Empty row between sections
      sheet.addRow([]);
      currentRow++;
    });

    // ===== Column Widths =====
    const colWidths = [12, 16, 18, 18, 14, 14, 14, 14, 14, 14, 14, 14];
    colWidths.forEach((w, i) => (sheet.getColumn(i + 1).width = w));

    // ===== Save File =====
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), 'Area_Report.xlsx');
  };

  useEffect(() => {
    fetchSurvey();
  }, []);

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
          onClick={() => navigate(-1)}
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

      <Typography variant="h6" fontSize={18} fontWeight={700} align="center" mb={2}>
        Area Report Between {reportDetails.current.initialEntry} and{' '}
        {reportDetails.current.secondaryEntry}
      </Typography>

      <TableContainer component={Paper} sx={{ maxHeight: '90vh' }}>
        <Table sx={{ minWidth: 650 }} size="small">
          <TableHead
            sx={{
              backgroundColor: '#f4f6f8',
              '& .MuiTableCell-root': {
                border: '1px solid rgba(224, 224, 224, 1)',
                fontWeight: 700,
              },
              position: 'sticky',
              top: 0,
            }}
          >
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }} rowSpan={2}>
                Sl.No.
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} rowSpan={2}>
                Distance Meters
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} rowSpan={2}>
                {reportDetails?.current?.initialEntry || ''} Meters
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} rowSpan={2}>
                {reportDetails?.current?.secondaryEntry || ''} Meters
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} colSpan={4} align="center">
                Cutting Area
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} colSpan={4} align="center">
                Filling Area
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Cutting Meters</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Avg Meters</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Width Meters</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Area Sq. Mtrs</TableCell>

              <TableCell sx={{ fontWeight: 700 }}>Filling Meters</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Avg Meters</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Width Meters</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Area Sq. Mtrs</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {tableData.map((row, index) => (
              <Fragment key={index}>
                <TableRow>
                  <TableCell colSpan={12} sx={{ fontWeight: 'bold' }}>
                    Section: {row.section}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={12} sx={{ py: 1.8 }}></TableCell>
                </TableRow>

                {row?.data?.map((entry, idx) => (
                  <TableRow key={`${index}-${idx}`}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{entry.offset}</TableCell>
                    <TableCell>{entry.initialEntryRL}</TableCell>
                    <TableCell>{entry.secondaryEntryRL}</TableCell>
                    <TableCell>{entry.cuttingMtr}</TableCell>
                    <TableCell>{entry.cuttingAvgMtr}</TableCell>
                    <TableCell>{entry.cuttingWMtr}</TableCell>
                    <TableCell>{entry.cuttingAreaSqMtr}</TableCell>
                    <TableCell>{entry.fillingMtr}</TableCell>
                    <TableCell>{entry.fillingAvgMtr}</TableCell>
                    <TableCell>{entry.fillingWMtr}</TableCell>
                    <TableCell>{entry.fillingAreaSqMtr}</TableCell>
                  </TableRow>
                ))}

                <TableRow>
                  <TableCell colSpan={4}></TableCell>

                  <TableCell colSpan={3} sx={{ fontWeight: 'bold' }}>
                    Total
                  </TableCell>

                  <TableCell sx={{ fontWeight: 'bold' }}>
                    {Number(row?.totalCuttingAreaSqMtr)?.toFixed(3)}
                  </TableCell>
                  <TableCell colSpan={3}></TableCell>

                  <TableCell sx={{ fontWeight: 'bold' }}>
                    {Number(row?.totalFillingAreaSqMtr)?.toFixed(3)}
                  </TableCell>
                </TableRow>
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default AreaReport;
