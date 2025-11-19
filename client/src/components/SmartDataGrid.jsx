import { DataGrid } from '@mui/x-data-grid';

const BasicDataGrid = ({
  rows,
  columns,
  loading = false,
  checkbox = false,
  length = 10,
  getRowHeight = false,
  classNames,
}) => {
  return (
    <DataGrid
      checkboxSelection={checkbox}
      getRowHeight={getRowHeight}
      rows={rows}
      columns={columns}
      loading={loading}
      getRowClassName={(params) =>
        `${classNames} ${
          params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd'
        }`
      }
      initialState={{
        pagination: {
          paginationModel: { pageSize: length },
        },
      }}
      scrollbarSize={0}
      pageSizeOptions={[10, 15, 20, 50]}
      disableColumnResize
      density="compact"
      slotProps={{
        filterPanel: {
          filterFormProps: {
            logicOperatorInputProps: {
              variant: 'outlined',
              size: 'small',
            },
            columnInputProps: {
              variant: 'outlined',
              size: 'small',
              sx: { mt: 'auto' },
            },
            operatorInputProps: {
              variant: 'outlined',
              size: 'small',
              sx: { mt: 'auto' },
            },
            valueInputProps: {
              InputComponentProps: {
                variant: 'outlined',
                size: 'small',
              },
            },
          },
        },
      }}
    />
  );
};
export default BasicDataGrid;
