import { useMemo, useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

const ReactTableImpl = () => {
  const [state, setStateFunc] = useState({
    data: [],
    loading: false,
    pageCount: 0,
    filter: "",
    search: "",
    pagination: {
      pageIndex: 0,
      pageSize: 10,
    },
    sorting: [],
  });

  const { data, loading, pageCount, filter, search, pagination, sorting } =
    useMemo(
      () => ({
        data: state.data,
        loading: state.loading,
        pageCount: state.pageCount,
        filter: state.filter,
        search: state.search,
        pagination: state.pagination,
        sorting: state.sorting,
      }),
      [state]
    );

  const setState = (params) =>
    setStateFunc((prevState) => ({ ...prevState, ...params }));
  const onChangeSearch = (e) => setState({ search: e.target?.value });
  const onChangeFilter = (e) => setState({ filter: e.target?.value });
  const columns = useMemo(
    () => [
      { accessorKey: "id", header: "ID", enableSorting: true },
      { accessorKey: "title", header: "Title", enableSorting: true },
    ],
    []
  );

  const fetchApiData = async ({ pageIndex, pageSize, search, filter, sorting }) => {
    setState({ loading: true });

    try {
      const params = new URLSearchParams({
        _limit: pageSize,
        _page: pageIndex + 1,
        q: search,
        title_like: filter,
      });

      if (sorting.length > 0) {
        params.append("_sort", sorting.map((s) => s.id).join(","));
        params.append(
          "_order",
          sorting.map((s) => (s.desc ? "desc" : "asc")).join(",")
        );
      }
      console.log({sorting});

      const response = await axios.get(
        `https://jsonplaceholder.typicode.com/posts?${params}`
      );
      setState({ data: response?.data });

      const totalRecords = parseInt(response.headers["x-total-count"], 10);
      setState({ pageCount: Math.ceil(totalRecords / pageSize) });
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setState({ loading: false });
  };

  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };

      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedFetchApiData = useCallback(debounce(fetchApiData, 250), []);

  const table = useReactTable({
    columns,
    data,
    state: {
      pagination,
      sorting,
    },
    pageCount,
    manualPagination: true,
    onPaginationChange: (updater) => {
      const nextState = updater(pagination);
      setState({ pagination: nextState });
    },
    manualSorting: true,
    onSortingChange: (updater) => {
      const nextState = updater(sorting);
      setState({ sorting: nextState });
      console.log({nextState});
    },
    getCoreRowModel: getCoreRowModel(),
    debugTable: true,
  });

  useEffect(() => {
    debouncedFetchApiData({ ...pagination, search, filter, sorting });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filter, pagination, sorting]);

  return (
    <div className="container mx-auto py-6">
      <div className="mb-4 flex space-x-2">
        <input
          value={search}
          onChange={onChangeSearch}
          placeholder="Search"
          className="p-2 border border-gray-300"
        />
        <input
          value={filter}
          onChange={onChangeFilter}
          placeholder="Filter by Title"
          className="p-2 border border-gray-300"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}

                    {header.column.getIsSorted()
                      ? header.column.getIsSorted() === "desc"
                        ? " 🔽"
                        : " 🔼"
                      : ""}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  Loading...
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex justify-between">
        <span className="text-sm text-gray-700">
          Showing{" "}
          {table.getState().pagination.pageIndex *
            table.getState().pagination.pageSize +
            1}{" "}
          to{" "}
          {(table.getState().pagination.pageIndex + 1) *
            table.getState().pagination.pageSize}{" "}
          of {pageCount * table.getState().pagination.pageSize} entries
        </span>
        <div>
          <button
            onClick={() => table.setPageIndex(0)}
            disabled={table.getState().pagination.pageIndex === 0}
            className="px-4 py-2 mx-1 border font-bold"
          >
            {"<<"}
          </button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-4 py-2 mx-1 border font-bold"
          >
            {"<"}
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-4 py-2 mx-1 border font-bold"
          >
            {">"}
          </button>
          <button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={
              table.getState().pagination.pageIndex === table.getPageCount() - 1
            }
            className="px-4 py-2 mx-1 border font-bold"
          >
            {">>"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReactTableImpl;
