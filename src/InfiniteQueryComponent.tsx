import { Table } from 'antd';
import { useInfiniteQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useLayoutEffect, useRef } from 'react';

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

const PAGE_SIZE = 100;
const MAX_PAGES = 10;

// Mock fetch function to simulate API call
const fetchItems = async (pageParam = 1): Promise<ApiResponse> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Calculate start and end items for this page
  const pageSize = PAGE_SIZE;
  const start = (pageParam - 1) * pageSize + 1;
  const totalRecords = 10000;
  
  // Create items for this page
  const items: Item[] = [];
  for (let i = 0; i < pageSize; i++) {
    const id = start + i;
    if (id <= totalRecords) {
      items.push({ id, name: `Item ${id}` });
    }
  }
  
  return {
    item: items,
    totalRecords: totalRecords,
    pageNumber: pageParam,
    pageSize: PAGE_SIZE,
    page: pageParam,
    hasNextPage: pageParam * pageSize < totalRecords,
    hasPreviousPage: pageParam > 1
  };
};

export const useItemsQuery = () =>
  useInfiniteQuery({
    queryKey: ['items'],
    queryFn: ({ pageParam }) => fetchItems(pageParam),
    initialPageParam: 1,
    getPreviousPageParam: (firstPage) =>
      firstPage.hasPreviousPage ? firstPage.page - 1 : undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage ? lastPage.page + 1 : undefined,
    maxPages: MAX_PAGES
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
  const prevPageParams = useRef<number[]>([]);
  const scrollHeightRef=useRef<number>(0);
  const tableBodyRef = useRef<HTMLDivElement | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    fetchPreviousPage,
    isFetchingPreviousPage,
    hasPreviousPage,
    status,
  } = useItemsQuery();

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

  useLayoutEffect(() => {
    if (!tableBodyRef.current) {
      tableBodyRef.current = document.querySelector('.ant-table-tbody-virtual-holder') as HTMLDivElement | null;
    }
    const tableBody = tableBodyRef.current;
    const pageParams = data?.pageParams as number[] | undefined;
      if (
      tableBody &&
      pageParams &&
      pageParams.length === MAX_PAGES &&
      prevPageParams.current.length === MAX_PAGES &&
      !isFetchingPreviousPage &&
      !isFetchingNextPage &&
      pageParams[0] !== prevPageParams.current[0]
    ) {
        if (pageParams[0] < prevPageParams.current[0]) {
          tableBody.scrollTop = (scrollHeightRef.current/MAX_PAGES)
        } else if (pageParams[0] > prevPageParams.current[0]) {
          tableBody.scrollTop = ((MAX_PAGES-1)*scrollHeightRef.current/(MAX_PAGES))-50
        }
      }
      prevPageParams.current = pageParams ?? [];  
    }, [data?.pageParams, isFetchingPreviousPage, isFetchingNextPage]);

  const handleTableScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    scrollHeightRef.current=scrollHeight;
    if (scrollHeight - scrollTop - clientHeight < 50 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
    if (scrollTop < 50 && hasPreviousPage && !isFetchingPreviousPage) {
      fetchPreviousPage();
    }
  };

  return (
    <div className="infinite-query-container" style={{ padding: '90px' }}>
      <h2>Infinite Query Example</h2>
      
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
            scroll={{ y: 300 }}
            size='small'
            virtual
            onScroll={handleTableScroll}
          />
          <div className="stats">
            <p>Total records: {data.pages[0].totalRecords}</p>
            <p>Pages loaded: {data.pages.length}</p>
          </div>
        </>
      )}
    </div>
  );
}