import { Table } from 'antd';
import { useInfiniteQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

interface Item {
  id: number;
  name: string;
}

interface ApiResponse {
  item: Item[];
  totalRecords: number;
  pageNumber: number;
  pageSize: number;
  page: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface ItemFilters {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Mock fetch function to simulate API call
const fetchItems = async (
  pageParam = 1,
  filters: ItemFilters = {}
): Promise<ApiResponse> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Calculate start and end items for this page
  const pageSize = 10;
  const start = (pageParam - 1) * pageSize + 1;
  const totalRecords = 300;
  
  // Create items for this page
  const items: Item[] = [];
  for (let i = 0; i < pageSize; i++) {
    const id = start + i;
    if (id <= totalRecords) {
      items.push({ id, name: `Item ${id}${filters.search ? ` (matching: ${filters.search})` : ''}` });
    }
  }
  
  return {
    item: items,
    totalRecords: totalRecords,
    pageNumber: pageParam,
    pageSize: 10,
    page: pageParam,
    hasNextPage: pageParam * pageSize < totalRecords,
    hasPreviousPage: pageParam > 1
  };
};

export const useItemsQuery = (filters: ItemFilters = {}) =>
  useInfiniteQuery({
    queryKey: ['items', filters],
    queryFn: ({ pageParam }) => fetchItems(pageParam, filters),
    initialPageParam: 1,
    getPreviousPageParam: (firstPage) =>
      firstPage.hasPreviousPage ? firstPage.page - 1 : undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage ? lastPage.page + 1 : undefined,
    maxPages: 3
  });

const queryClient = new QueryClient();

export default function InfiniteQueryComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <InfiniteQueryContent />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

function InfiniteQueryContent() {
  const [filters, setFilters] = useState<ItemFilters>({});
  const [searchInput, setSearchInput] = useState('');
  
  const {
    data,
    fetchNextPage,
    fetchPreviousPage,
    hasNextPage,
    hasPreviousPage,
    isFetchingNextPage,
    isFetchingPreviousPage,
    status,
  } = useItemsQuery(filters);

  const handleSearch = () => {
    setFilters(prev => ({
      ...prev,
      search: searchInput
    }));
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
  ];

  const dataSource = data?.pages.flatMap((page) => page.item);

  return (
    <div className="infinite-query-container">
      <h2>Infinite Query Example</h2>
      
      <div className="filters">
        <input 
          type="text" 
          value={searchInput} 
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search items"
        />
        <button onClick={handleSearch}>Search</button>
      </div>
      
      {status === 'pending' ? (
        <div>Loading...</div>
      ) : status === 'error' ? (
        <div>Error loading data</div>
      ) : (
        <>
          <Table
            columns={columns}
            dataSource={dataSource}
            rowKey="id"
            pagination={false}
          />
          <div className="load-more">
            <button
              onClick={() => fetchPreviousPage()}
              disabled={!hasPreviousPage || isFetchingPreviousPage}
            >
              {isFetchingPreviousPage
                ? 'Loading previous...'
                : hasPreviousPage
                ? 'Load Previous'
                : 'No previous page'}
            </button>
            <button
              onClick={() => fetchNextPage()}
              disabled={!hasNextPage || isFetchingNextPage}
            >
              {isFetchingNextPage
                ? 'Loading more...'
                : hasNextPage
                ? 'Load More'
                : 'No more items to load'}
            </button>
          </div>
          
          <div className="stats">
            <p>Total records: {data.pages[0].totalRecords}</p>
            <p>Pages loaded: {data.pages.length}</p>
          </div>
        </>
      )}
    </div>
  );
}
